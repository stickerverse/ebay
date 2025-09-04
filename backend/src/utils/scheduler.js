const cron = require('node-cron');
const User = require('../models/User');
const ebayService = require('../services/ebayService');
const aiService = require('../services/aiService');
const Message = require('../models/Message');
const logger = require('./logger');

class MessageScheduler {
  constructor() {
    this.syncJob = null;
    this.cleanupJob = null;
  }

  start() {
    this.syncJob = cron.schedule('*/5 * * * *', async () => {
      await this.syncAllUserMessages();
    });

    this.cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldMessages();
    });

    logger.info('Message scheduler started');
  }

  stop() {
    if (this.syncJob) {
      this.syncJob.stop();
    }
    if (this.cleanupJob) {
      this.cleanupJob.stop();
    }
    logger.info('Message scheduler stopped');
  }

  async syncAllUserMessages() {
    try {
      const activeUsers = await User.find({
        isActive: true,
        'ebayCredentials.accessToken': { $exists: true }
      });

      for (const user of activeUsers) {
        try {
          await this.syncUserMessages(user);
        } catch (error) {
          logger.error(`Sync failed for user ${user._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Scheduled sync error:', error);
    }
  }

  async syncUserMessages(user) {
    try {
      const ebayMessages = await ebayService.fetchMessages(
        user.ebayCredentials.accessToken,
        user.ebayCredentials.environment
      );

      let processedCount = 0;

      for (const inquiry of (ebayMessages.inquiries || [])) {
        const existingMessage = await Message.findOne({
          userId: user._id,
          inquiryId: inquiry.inquiryId
        });

        if (!existingMessage) {
          const category = aiService.classifyMessage(inquiry.inquiryText);
          const sentiment = aiService.analyzeSentiment(inquiry.inquiryText);
          const priority = aiService.calculatePriority(inquiry.inquiryText, sentiment);
          const escalated = aiService.shouldEscalate(inquiry.inquiryText, user.settings.autoResponse.escalationKeywords);

          const message = new Message({
            userId: user._id,
            inquiryId: inquiry.inquiryId,
            buyer: inquiry.buyerUsername,
            subject: inquiry.subject || 'No Subject',
            message: inquiry.inquiryText,
            itemId: inquiry.itemId,
            category,
            sentiment,
            priority,
            escalated,
            ebayTimestamp: new Date(inquiry.creationDate),
            status: inquiry.inquiryStatus === 'CLOSED' ? 'closed' : 'pending'
          });

          await message.save();
          processedCount++;

          if (user.settings.autoResponse.enabled && 
              !escalated && 
              priority !== 'high' && 
              message.status === 'pending' &&
              aiService.isWithinBusinessHours(user.settings.autoResponse.businessHours, user.settings.autoResponse.weekdaysOnly)) {
            
            setTimeout(async () => {
              await this.processAutoResponse(message, user);
            }, user.settings.autoResponse.responseDelay * 1000);
          }
        }
      }

      if (processedCount > 0) {
        logger.info(`Processed ${processedCount} new messages for user ${user._id}`);
      }

    } catch (error) {
      if (error.message === 'INVALID_TOKEN') {
        try {
          const tokenData = await ebayService.refreshToken(
            user.ebayCredentials.clientId,
            user.ebayCredentials.clientSecret,
            user.ebayCredentials.refreshToken,
            user.ebayCredentials.environment
          );

          user.ebayCredentials.accessToken = tokenData.access_token;
          if (tokenData.refresh_token) {
            user.ebayCredentials.refreshToken = tokenData.refresh_token;
          }
          await user.save();

          logger.info(`Refreshed token for user ${user._id}`);
        } catch (refreshError) {
          logger.error(`Token refresh failed for user ${user._id}:`, refreshError);
        }
      } else {
        throw error;
      }
    }
  }

  async processAutoResponse(message, user) {
    try {
      const responseText = aiService.generateResponse(
        message.category,
        user.settings.autoResponse.templates,
        message.buyer
      );

      await ebayService.sendResponse(
        message.inquiryId,
        responseText,
        user.ebayCredentials.accessToken,
        user.ebayCredentials.environment
      );

      message.response = responseText;
      message.responseTime = new Date();
      message.status = 'auto_responded';
      message.autoProcessed = true;
      await message.save();

      logger.info(`Auto-responded to message ${message._id}`);

    } catch (error) {
      logger.error(`Auto-response failed for message ${message._id}:`, error);
      message.escalated = true;
      await message.save();
    }
  }

  async cleanupOldMessages() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Message.deleteMany({
        status: 'closed',
        updatedAt: { $lt: thirtyDaysAgo }
      });

      logger.info(`Cleaned up ${result.deletedCount} old messages`);
    } catch (error) {
      logger.error('Message cleanup error:', error);
    }
  }
}

module.exports = new MessageScheduler();
