const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const User = require('../backend/src/models/User');

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ebay_store_manager');
    
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      isActive: true,
      settings: {
        autoResponse: {
          enabled: true,
          responseDelay: 300,
          businessHours: {
            start: '09:00',
            end: '17:00'
          },
          weekdaysOnly: true,
          maxDailyResponses: 100,
          escalationKeywords: ['complaint', 'angry', 'disappointed', 'lawsuit', 'attorney', 'dispute', 'scam', 'fraud'],
          templates: {
            shipping: 'Your item will ship within 1-2 business days via the method selected at checkout. You\'ll receive tracking information once processed.',
            returns: 'We accept returns within 30 days. Items must be in original condition. Please message us with your order number to start the return process.',
            payment: 'Payment issues are usually resolved within 24 hours. Please check your PayPal account or contact your payment provider.',
            technical: 'For technical issues, please provide your item number and detailed description. We\'ll help resolve this quickly.',
            warranty: 'This item comes with our standard warranty. Please provide your order details and we\'ll review your warranty claim.',
            greeting: 'Thank you for your message! We appreciate your business and will respond promptly during business hours.',
            general: 'Thank you for contacting us. We\'ve received your message and will respond within 24 hours during business days.'
          }
        }
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();
