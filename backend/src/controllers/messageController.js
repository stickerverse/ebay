const Message = require('../models/Message');
const User = require('../models/User');
const ebayService = require('../services/ebayService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

exports.syncMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.ebayCredentials?.accessToken) {
      return res.status(400).json({ 
        success: false,
        error: 'eBay credentials not configured. Please add them in Settings.' 
      });
    }

    const { accessToken, environment = 'sandbox', clientId, clientSecret, refreshToken } = user.ebayCredentials;

    // Calculate date range - last 30 days by default
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startTimeISO = startDate.toISOString();
    const endTimeISO = now.toISOString();

    let fetchResult;
    try {
      fetchResult = await ebayService.fetchMessages({
        accessToken,
        environment,
        startTimeISO,
        endTimeISO,
        page: 1,
        entriesPerPage: 100,
        includeHighLevelOnly: false
      });
    } catch (error) {
      if (error.message === 'INVALID_TOKEN' && refreshToken) {
        // Attempt token refresh
        try {
          logger.info(`Refreshing token for user ${user._id}`);
          const tokenData = await ebayService.refreshToken(
            clientId,
            clientSecret,
            refreshToken,
            environment
          );

          // Update user credentials
          user.ebayCredentials.accessToken = tokenData.access_token;
          if (tokenData.refresh_token) {
            user.ebayCredentials.refreshToken = tokenData.refresh_token;
          }
          await user.save();

          // Retry fetch with new token
          fetchResult = await ebayService.fetchMessages({
            accessToken: tokenData.access_token,
            environment,
            startTimeISO,
            endTimeISO,
            page: 1,
            entriesPerPage: 100
          });
        } catch (refreshError) {
          logger.error('Token refresh failed:', refreshError);
          return res.status(401).json({ 
            success: false,
            error: 'Token refresh failed. Please re-authenticate with eBay.' 
          });
        }
      } else {
        throw error;
      }
    }

    const messages = fetchResult?.messages || [];
    const processedMessages = [];

    for (const msgData of messages) {
      try {
        // Check if message already exists
        const existingMessage = await Message.findOne({
          userId: req.user.id,
          externalId: msgData.externalId
        });

        if (existingMessage) {
          logger.debug(`Message ${msgData.externalId} already exists, skipping`);
          continue;
        }

        // AI processing
        const messageText = msgData.messageText || msgData.subject || '';
        const category = aiService.classifyMessage(messageText);
        const sentiment = aiService.analyzeSentiment(messageText);
        const priority = aiService.calculatePriority(messageText, sentiment);
        const escalated = aiService.shouldEscalate(
          messageText, 
          user.settings?.autoResponse?.escalationKeywords || []
        );

        // Create new message document
        const newMessage = new Message({
          userId: req.user.id,
          externalId: msgData.externalId,
          threadId: msgData.threadId,
          senderUsername: msgData.senderUsername,
          recipientUsername: msgData.recipientUsername,
          senderType: msgData.senderType,
          isSystem: msgData.isSystem,
          subject: msgData.subject || 'No Subject',
          messageText: messageText,
          itemId: msgData.itemId,
          category,
          sentiment,
          priority,
          status: 'pending',
          response: null,
          responseTime: null,
          escalated,
          autoProcessed: false,
          ebayTimestamp: new Date(msgData.creationDate),
          raw: msgData.raw
        });

        await newMessage.save();
        processedMessages.push(newMessage);

        logger.info(`Processed new message: ${newMessage.externalId} from ${newMessage.senderUsername}`);

        // Auto-response logic
        const autoResponseSettings = user.settings?.autoResponse;
        if (
          autoResponseSettings?.enabled &&
          !newMessage.isSystem &&
          newMessage.senderType === 'buyer' &&
          newMessage.itemId &&
          !escalated &&
          newMessage.status === 'pending' &&
          aiService.isWithinBusinessHours(
            autoResponseSettings.businessHours, 
            autoResponseSettings.weekdaysOnly
          )
        ) {
          // Schedule auto-response with delay
          setTimeout(async () => {
            await this.processAutoResponse(newMessage, user);
          }, (autoResponseSettings.responseDelay || 0) * 1000);
        }

      } catch (processingError) {
        logger.error(`Error processing message ${msgData.externalId}:`, processingError);
        // Continue processing other messages
      }
    }

    logger.info(`Sync completed for user ${user._id}: ${processedMessages.length} new messages processed`);

    res.json({
      success: true,
      newMessages: processedMessages.length,
      totalPulled: messages.length,
      message: processedMessages.length > 0 
        ? `Successfully synced ${processedMessages.length} new messages`
        : 'No new messages found'
    });

  } catch (error) {
    logger.error('Message sync error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'An unexpected error occurred during sync'
    });
  }
};

// Helper method for auto-response processing
exports.processAutoResponse = async (message, user) => {
  try {
    const responseText = aiService.generateResponse(
      message.category,
      user.settings?.autoResponse?.templates || {},
      message.senderUsername
    );

    // Attempt to send response via eBay API
    await ebayService.sendResponse({
      accessToken: user.ebayCredentials.accessToken,
      environment: user.ebayCredentials.environment || 'sandbox',
      recipientUserID: message.senderUsername,
      itemId: message.itemId,
      body: responseText,
      inquiryId: message.externalId // For Post-Order inquiries
    });

    // Update message status
    message.response = responseText;
    message.responseTime = new Date();
    message.status = 'auto_responded';
    message.autoProcessed = true;
    await message.save();

    logger.info(`Auto-response sent for message ${message._id}`);

  } catch (error) {
    logger.error(`Auto-response failed for message ${message._id}:`, error);
    
    // Mark message as escalated if auto-response fails
    message.escalated = true;
    message.status = 'pending';
    await message.save();
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      search, 
      source,
      priority,
      sentiment
    } = req.query;

    const query = { userId: req.user.id };

    // Status filtering
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

    // Category filtering
    if (category && category !== 'all') {
      query.category = category;
    }

    // Priority filtering
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Sentiment filtering
    if (sentiment && sentiment !== 'all') {
      query.sentiment = sentiment;
    }

    // Source filtering
    if (source === 'ebay') {
      query.isSystem = true;
    } else if (source === 'customers') {
      query.isSystem = false;
      query.senderType = 'buyer';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { senderUsername: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { messageText: new RegExp(search, 'i') },
        { itemId: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const messages = await Message.find(query)
      .sort({ ebayTimestamp: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean(); // Use lean for better performance

    const totalMessages = await Message.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / Number(limit));

    res.json({
      success: true,
      messages,
      currentPage: Number(page),
      totalPages,
      totalMessages,
      hasMore: Number(page) < totalPages
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve messages' 
    });
  }
};

exports.respondToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { responseText } = req.body;

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Response text is required' 
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      userId: req.user.id
    });

    if (!message) {
      return res.status(404).json({ 
        success: false,
        error: 'Message not found' 
      });
    }

    if (message.isSystem) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot reply to system messages' 
      });
    }

    if (message.senderType !== 'buyer') {
      return res.status(400).json({ 
        success: false,
        error: 'Can only reply to buyer messages' 
      });
    }

    const user = await User.findById(req.user.id);
    
    try {
      await ebayService.sendResponse({
        accessToken: user.ebayCredentials.accessToken,
        environment: user.ebayCredentials.environment || 'sandbox',
        recipientUserID: message.senderUsername,
        itemId: message.itemId,
        body: responseText.trim(),
        inquiryId: message.externalId
      });

      // Update message
      message.response = responseText.trim();
      message.responseTime = new Date();
      message.status = 'manually_responded';
      await message.save();

      res.json({ 
        success: true, 
        message: 'Response sent successfully',
        data: message
      });

    } catch (sendError) {
      if (sendError.message === 'INVALID_TOKEN') {
        return res.status(401).json({ 
          success: false,
          error: 'Token expired. Please refresh your eBay credentials.' 
        });
      } else if (sendError.message === 'RESPONSE_NOT_SUPPORTED') {
        return res.status(400).json({ 
          success: false,
          error: 'Response not supported for this message type' 
        });
      } else {
        throw sendError;
      }
    }

  } catch (error) {
    logger.error('Respond to message error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send response' 
    });
  }
};

// Get message statistics
exports.getMessageStats = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const daysBack = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const pipeline = [
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          autoResponded: {
            $sum: { $cond: [{ $eq: ['$status', 'auto_responded'] }, 1, 0] }
          },
          manuallyResponded: {
            $sum: { $cond: [{ $eq: ['$status', 'manually_responded'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          escalated: {
            $sum: { $cond: ['$escalated', 1, 0] }
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ];

    const [stats] = await Message.aggregate(pipeline);
    
    const responseStats = {
      totalMessages: stats?.totalMessages || 0,
      autoResponded: stats?.autoResponded || 0,
      manuallyResponded: stats?.manuallyResponded || 0,
      pending: stats?.pending || 0,
      escalated: stats?.escalated || 0,
      highPriority: stats?.highPriority || 0,
      responseRate: stats?.totalMessages > 0 
        ? (((stats.autoResponded + stats.manuallyResponded) / stats.totalMessages) * 100).toFixed(1)
        : '0'
    };

    res.json({
      success: true,
      stats: responseStats,
      timeRange
    });

  } catch (error) {
    logger.error('Get message stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve message statistics' 
    });
  }
};