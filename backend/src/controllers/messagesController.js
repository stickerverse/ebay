const Message = require('../models/Message');
const User = require('../models/User');
const ebayService = require('../services/ebayService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

exports.getMessages = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user.id };

    if (status && status !== 'all') {
      if (status === 'high_priority') {
        query.priority = 'high';
      } else {
        query.status = status;
      }
    }
    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };

    const messages = await Message.find(query)
      .sort({ ebayTimestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const totalMessages = await Message.countDocuments(query);

    res.json({
      success: true,
      messages,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

exports.syncMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.ebayCredentials || !user.ebayCredentials.accessToken) {
      return res.status(400).json({ error: 'eBay credentials are not configured. Please add them in Settings.' });
    }

    const ebayData = await ebayService.fetchMessages(
      user.ebayCredentials.accessToken,
      user.ebayCredentials.environment
    );

    const inquiries = ebayData?.inquiries || [];
    if (inquiries.length === 0) {
      return res.json({ success: true, newMessages: 0, message: "No new messages found." });
    }

    let newMessagesCount = 0;
    for (const inquiry of inquiries) {
      const existingMessage = await Message.findOne({ inquiryId: inquiry.inquiryId, userId: user._id });

      if (!existingMessage) {
        newMessagesCount++;
        
        // --- Crash-Proof Data Extraction ---
        const messageText = inquiry.lastMessage?.content || 'No message content available';
        const subject = inquiry.claimAmount ? `${inquiry.inquiryType} - ${inquiry.claimAmount.value} ${inquiry.claimAmount.currency}` : inquiry.inquiryType;
        
        const category = aiService.classifyMessage(messageText);
        const sentiment = aiService.analyzeSentiment(messageText);
        const priority = aiService.calculatePriority(messageText, sentiment);
        const shouldEscalate = aiService.shouldEscalate(messageText, user.settings?.autoResponse?.escalationKeywords);
        
        const newMessage = new Message({
          userId: user._id,
          inquiryId: inquiry.inquiryId,
          buyer: inquiry.buyerUsername || 'Unknown Buyer',
          subject: subject,
          message: messageText,
          itemId: inquiry.itemDetails?.itemId || null,
          category,
          sentiment,
          priority,
          status: inquiry.inquiryState === 'CLOSED' ? 'closed' : 'pending',
          escalated: shouldEscalate,
          ebayTimestamp: new Date(inquiry.creationDate?.value || Date.now()),
        });

        await newMessage.save();
      }
    }

    res.json({ success: true, newMessages: newMessagesCount, message: `Synced ${newMessagesCount} new messages.` });

  } catch (error) {
    logger.error('Sync messages error:', error);
    // This provides a specific error message to the frontend instead of a generic 500
    res.status(500).json({ error: error.message || 'An unexpected error occurred during sync.' });
  }
};

exports.respondToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { responseText } = req.body;
    const user = await User.findById(req.user.id);

    const message = await Message.findOne({ _id: messageId, userId: req.user.id });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await ebayService.sendResponse(
      message.inquiryId,
      responseText,
      user.ebayCredentials.accessToken,
      user.ebayCredentials.environment
    );

    message.response = responseText;
    message.responseTime = new Date();
    message.status = 'responded';
    await message.save();

    res.json({ success: true, message: 'Response sent successfully.' });
  } catch (error) {
    logger.error('Respond to message error:', error);
    res.status(500).json({ error: 'Failed to send response.' });
  }
};
