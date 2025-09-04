// controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');
const ebayService = require('../services/ebayService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

exports.syncMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.ebayCredentials?.accessToken) {
      return res.status(400).json({ error: 'eBay credentials not configured' });
    }

    const accessToken = user.ebayCredentials.accessToken;
    const environment = user.ebayCredentials.environment || 'production';

    // Pull last 30 days by default (adjust as desired)
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startTimeISO = start.toISOString();
    const endTimeISO = now.toISOString();

    let fetched = await ebayService.fetchMessages({
      accessToken,
      environment,
      startTimeISO,
      endTimeISO,
      page: 1,
      entriesPerPage: 100,
      includeHighLevelOnly: false
    });

    const msgs = fetched.messages || [];
    const processed = [];

    for (const m of msgs) {
      // Skip if we already have this message for this user
      const exists = await Message.findOne({
        userId: req.user.id,
        externalId: m.externalId
      }).lean();

      if (exists) continue;

      const textForAI = m.messageText || `${m.subject || ''}`;
      const category = aiService.classifyMessage(textForAI);
      const sentiment = aiService.analyzeSentiment(textForAI);
      const priority = aiService.calculatePriority(textForAI, sentiment);
      const escalated = aiService.shouldEscalate(textForAI, user.settings?.autoResponse?.escalationKeywords || []);

      const doc = new Message({
        userId: req.user.id,
        externalId: m.externalId,
        threadId: m.threadId || null,
        senderUsername: m.senderUsername || null,
        recipientUsername: m.recipientUsername || null,
        senderType: m.senderType || 'unknown',
        isSystem: !!m.isSystem,
        subject: m.subject || 'No Subject',
        messageText: m.messageText || '',
        itemId: m.itemId || null,
        category,
        sentiment,
        priority,
        status: 'pending',
        response: null,
        responseTime: null,
        escalated,
        autoProcessed: false,
        ebayTimestamp: m.creationDate || new Date(),
        raw: m.raw || null
      });

      await doc.save();
      processed.push(doc);

      // Auto-response: only for buyer messages with itemId (respondable)
      const ar = user.settings?.autoResponse;
      if (
        ar?.enabled &&
        !doc.isSystem &&
        doc.senderType === 'buyer' &&
        doc.itemId &&
        !escalated &&
        doc.status === 'pending' &&
        aiService.isWithinBusinessHours(ar.businessHours, ar.weekdaysOnly)
      ) {
        setTimeout(async () => {
          try {
            const responseText = aiService.generateResponse(
              doc.category,
              ar.templates,
              doc.senderUsername
            );

            await ebayService.sendResponse({
              accessToken: user.ebayCredentials.accessToken,
              environment,
              recipientUserID: doc.senderUsername,
              itemId: doc.itemId,
              body: responseText
            });

            doc.response = responseText;
            doc.responseTime = new Date();
            doc.status = 'auto_responded';
            doc.autoProcessed = true;
            await doc.save();
          } catch (e) {
            logger.error('Auto-response error:', e);
            doc.escalated = true;
            await doc.save();
          }
        }, (ar.responseDelay || 0) * 1000);
      }
    }

    res.json({
      success: true,
      newMessages: processed.length,
      totalPulled: msgs.length
    });

  } catch (error) {
    if (error.message === 'INVALID_TOKEN') {
      // Attempt a refresh
      try {
        const user = await User.findById(req.user.id);
        const tokenData = await ebayService.refreshToken(
          user.ebayCredentials.clientId,
          user.ebayCredentials.clientSecret,
          user.ebayCredentials.refreshToken,
          user.ebayCredentials.environment || 'production'
        );

        user.ebayCredentials.accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
          user.ebayCredentials.refreshToken = tokenData.refresh_token;
        }
        await user.save();

        return res.json({ success: true, tokenRefreshed: true });
      } catch (refreshError) {
        return res.status(401).json({ error: 'Token refresh failed. Please re-authenticate.' });
      }
    }

    logger.error('Message sync error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search, source } = req.query;

    const query = { userId: req.user.id };

    if (status && status !== 'all') {
      if (status === 'responded') {
        query.status = { $in: ['auto_responded', 'manually_responded'] };
      } else if (status === 'escalated') {
        query.escalated = true;
      } else if (status === 'high_priority') {
        query.priority = 'high';
      } else {
        query.status = status;
      }
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    // NEW: filter by source (ebay system vs customers)
    if (source === 'ebay') {
      query.isSystem = true;
    } else if (source === 'customers') {
      query.isSystem = false;
      query.senderType = 'buyer';
    }

    if (search) {
      query.$or = [
        { senderUsername: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { messageText: new RegExp(search, 'i') }
      ];
    }

    const items = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Message.countDocuments(query);

    res.json({
      messages: items,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalMessages: total
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.respondToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { responseText } = req.body;

    const message = await Message.findOne({
      _id: messageId,
      userId: req.user.id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.isSystem || message.senderType !== 'buyer') {
      return res.status(400).json({ error: 'Cannot reply to system messages. Reply is only available for buyer AAQ messages.' });
    }

    if (!message.itemId || !message.senderUsername) {
      return res.status(400).json({ error: 'Missing itemId or buyer username for reply.' });
    }

    const user = await User.findById(req.user.id);

    await ebayService.sendResponse({
      accessToken: user.ebayCredentials.accessToken,
      environment: user.ebayCredentials.environment || 'production',
      recipientUserID: message.senderUsername,
      itemId: message.itemId,
      body: responseText
    });

    message.response = responseText;
    message.responseTime = new Date();
    message.status = 'manually_responded';
    await message.save();

    res.json({ success: true, message });

  } catch (error) {
    if (error.message === 'INVALID_TOKEN') {
      return res.status(401).json({ error: 'Token expired. Please refresh.' });
    }
    logger.error('Respond to message error:', error);
    res.status(500).json({ error: error.message });
  }
};
