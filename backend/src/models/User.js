const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  ebayCredentials: {
    clientId: String,
    clientSecret: String,
    accessToken: String,
    refreshToken: String,
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox'
    }
  },
  settings: {
    autoResponse: {
      enabled: {
        type: Boolean,
        default: true
      },
      responseDelay: {
        type: Number,
        default: 300
      },
      businessHours: {
        start: {
          type: String,
          default: '09:00'
        },
        end: {
          type: String,
          default: '17:00'
        }
      },
      weekdaysOnly: {
        type: Boolean,
        default: true
      },
      maxDailyResponses: {
        type: Number,
        default: 100
      },
      escalationKeywords: {
        type: [String],
        default: ['complaint', 'angry', 'disappointed', 'lawsuit', 'attorney', 'dispute', 'scam', 'fraud']
      },
      templates: {
        shipping: {
          type: String,
          default: 'Your item will ship within 1-2 business days via the method selected at checkout. You\'ll receive tracking information once processed.'
        },
        returns: {
          type: String,
          default: 'We accept returns within 30 days. Items must be in original condition. Please message us with your order number to start the return process.'
        },
        payment: {
          type: String,
          default: 'Payment issues are usually resolved within 24 hours. Please check your PayPal account or contact your payment provider.'
        },
        technical: {
          type: String,
          default: 'For technical issues, please provide your item number and detailed description. We\'ll help resolve this quickly.'
        },
        warranty: {
          type: String,
          default: 'This item comes with our standard warranty. Please provide your order details and we\'ll review your warranty claim.'
        },
        greeting: {
          type: String,
          default: 'Thank you for your message! We appreciate your business and will respond promptly during business hours.'
        },
        general: {
          type: String,
          default: 'Thank you for contacting us. We\'ve received your message and will respond within 24 hours during business days.'
        }
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
