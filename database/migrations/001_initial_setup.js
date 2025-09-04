const mongoose = require('mongoose');
require('dotenv').config();

async function up() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    await db.createCollection('users');
    await db.createCollection('messages');
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('messages').createIndex({ userId: 1, status: 1 });
    await db.collection('messages').createIndex({ userId: 1, category: 1 });
    await db.collection('messages').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ inquiryId: 1 }, { unique: true });
    
    console.log('✅ Initial database setup completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  up();
}

module.exports = { up };
