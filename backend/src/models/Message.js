const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // eBay MessageID / ExternalMessageID - this should be unique per user, not globally
  externalId: {
    type: String,
    required: true
  },

  // Optional thread/grouping id if available
  threadId: { 
    type: String, 
    default: null,
    index: true 
  },

  // Who sent it (buyer username or "eBay")
  senderUsername: { 
    type: String, 
    default: null,
    index: true 
  },

  // Who received it (your seller username)
  recipientUsername: { type: String, default: null },

  // 'buyer' | 'ebay' | 'seller' | 'unknown'
  senderType: {
    type: String,
    enum: ['buyer', 'ebay', 'seller', 'unknown'],
    default: 'unknown',
    index: true
  },

  // True for system messages (from eBay)
  isSystem: { 
    type: Boolean, 
    default: false,
    index: true 
  },

  subject: { 
    type: String, 
    default: 'No Subject',
    index: 'text' // Text index for search
  },
  
  messageText: { 
    type: String, 
    default: '',
    index: 'text' // Text index for search
  },

  itemId: { 
    type: String, 
    default: null,
    index: true 
  },

  // AI enrichment
  category: {
    type: String,
    enum: ['shipping', 'returns', 'payment', 'technical', 'warranty', 'greeting', 'complaint', 'general'],
    default: 'general',
    index: true
  },
  
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['normal', 'medium', 'high'],
    default: 'normal',
    index: true
  },

  status: {
    type: String,
    enum: ['pending', 'auto_responded', 'manually_responded', 'closed'],
    default: 'pending',
    index: true
  },

  response: { type: String, default: null },
  responseTime: { type: Date, default: null },

  escalated: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  
  autoProcessed: { type: Boolean, default: false },

  // eBay timestamp from the original message
  ebayTimestamp: { 
    type: Date, 
    default: null,
    index: true 
  },

  // Keep original payload for debugging/audits
  raw: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: true
});

// Compound indexes for common queries
messageSchema.index({ userId: 1, status: 1 });
messageSchema.index({ userId: 1, senderType: 1, isSystem: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, ebayTimestamp: -1 });
messageSchema.index({ userId: 1, escalated: 1 });
messageSchema.index({ userId: 1, priority: 1 });
messageSchema.index({ userId: 1, category: 1 });

// Unique compound index to prevent duplicate messages per user
messageSchema.index({ userId: 1, externalId: 1 }, { unique: true });

// Text index for full-text search across subject and messageText
messageSchema.index({
  subject: 'text',
  messageText: 'text',
  senderUsername: 'text'
}, {
  weights: {
    subject: 10,
    messageText: 5,
    senderUsername: 1
  }
});

// Pre-save middleware to ensure data consistency
messageSchema.pre('save', function(next) {
  // Ensure externalId is set
  if (!this.externalId) {
    this.externalId = `${this.senderUsername || 'unknown'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set threadId if not provided
  if (!this.threadId) {
    this.threadId = this.externalId;
  }

  // Ensure ebayTimestamp is set
  if (!this.ebayTimestamp) {
    this.ebayTimestamp = this.createdAt || new Date();
  }

  next();
});

// Static methods for common queries
messageSchema.statics.findPendingForUser = function(userId) {
  return this.find({ 
    userId, 
    status: 'pending', 
    escalated: false 
  }).sort({ priority: -1, ebayTimestamp: -1 });
};

messageSchema.statics.findEscalatedForUser = function(userId) {
  return this.find({ 
    userId, 
    escalated: true 
  }).sort({ ebayTimestamp: -1 });
};

messageSchema.statics.findByStatusForUser = function(userId, status) {
  return this.find({ userId, status }).sort({ ebayTimestamp: -1 });
};

messageSchema.statics.getStatsForUser = async function(userId, daysBack = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        autoResponded: { $sum: { $cond: [{ $eq: ['$status', 'auto_responded'] }, 1, 0] } },
        manuallyResponded: { $sum: { $cond: [{ $eq: ['$status', 'manually_responded'] }, 1, 0] } },
        escalated: { $sum: { $cond: ['$escalated', 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    pending: 0,
    autoResponded: 0,
    manuallyResponded: 0,
    escalated: 0,
    highPriority: 0
  };
};

// Instance methods
messageSchema.methods.canRespond = function() {
  return !this.isSystem && 
         this.senderType === 'buyer' && 
         this.status === 'pending' &&
         this.itemId;
};

messageSchema.methods.markAsResponded = function(responseText, isAutomatic = false) {
  this.response = responseText;
  this.responseTime = new Date();
  this.status = isAutomatic ? 'auto_responded' : 'manually_responded';
  this.autoProcessed = isAutomatic;
  return this.save();
};

messageSchema.methods.escalate = function(reason = null) {
  this.escalated = true;
  if (reason) {
    this.escalationReason = reason;
  }
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);