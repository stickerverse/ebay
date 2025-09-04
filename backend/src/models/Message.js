// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // eBay MessageID / ExternalMessageID (unique per user)
  externalId: {
    type: String,
    required: true,
    unique: true
  },

  // Optional thread/grouping id if available
  threadId: { type: String, default: null },

  // Who sent it (buyer username or "eBay")
  senderUsername: { type: String, default: null },

  // Who received it (your seller username)
  recipientUsername: { type: String, default: null },

  // 'buyer' | 'ebay' | 'seller' | 'unknown'
  senderType: {
    type: String,
    enum: ['buyer', 'ebay', 'seller', 'unknown'],
    default: 'unknown'
  },

  // True for system messages (from eBay)
  isSystem: { type: Boolean, default: false },

  subject: { type: String, default: 'No Subject' },
  messageText: { type: String, default: '' },

  itemId: { type: String, default: null },

  // AI enrichment
  category: {
    type: String,
    enum: ['shipping', 'returns', 'payment', 'technical', 'warranty', 'greeting', 'complaint', 'general'],
    default: 'general'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  priority: {
    type: String,
    enum: ['normal', 'medium', 'high'],
    default: 'normal'
  },

  status: {
    type: String,
    enum: ['pending', 'auto_responded', 'manually_responded', 'closed'],
    default: 'pending'
  },

  response: { type: String, default: null },
  responseTime: { type: Date, default: null },

  escalated: { type: Boolean, default: false },
  autoProcessed: { type: Boolean, default: false },

  ebayTimestamp: { type: Date, default: null },

  // Keep original payload for debugging/audits
  raw: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: true
});

// Helpful indexes
messageSchema.index({ userId: 1, status: 1 });
messageSchema.index({ userId: 1, senderType: 1, isSystem: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, ebayTimestamp: -1 });
messageSchema.index({ userId: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Message', messageSchema);
