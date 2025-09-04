// Create this file as: backend/debug/testEbayConnection.js
const mongoose = require('mongoose');
const User = require('../src/models/User');
const ebayService = require('../src/services/ebayService');
require('dotenv').config();

async function debugEbayConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ebay_store_manager');
    console.log('✅ Connected to MongoDB');

    // Find a user with eBay credentials
    const user = await User.findOne({ 
      'ebayCredentials.accessToken': { $exists: true } 
    });

    if (!user) {
      console.log('❌ No user found with eBay credentials');
      console.log('Please configure eBay credentials first through the UI');
      return;
    }

    console.log(`\n🔍 Testing eBay connection for user: ${user.email}`);
    console.log(`Environment: ${user.ebayCredentials.environment || 'sandbox'}`);

    // Test 1: Connection Test
    console.log('\n--- Test 1: Connection Test ---');
    try {
      const connectionResult = await ebayService.testConnection(
        user.ebayCredentials.accessToken,
        user.ebayCredentials.environment
      );
      console.log('✅ Connection test result:', connectionResult);
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
      
      if (error.message === 'INVALID_TOKEN' && user.ebayCredentials.refreshToken) {
        console.log('🔄 Attempting token refresh...');
        try {
          const tokenData = await ebayService.refreshToken(
            user.ebayCredentials.clientId,
            user.ebayCredentials.clientSecret,
            user.ebayCredentials.refreshToken,
            user.ebayCredentials.environment
          );
          console.log('✅ Token refresh successful');
          user.ebayCredentials.accessToken = tokenData.access_token;
          await user.save();
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError.message);
          return;
        }
      }
    }

    // Test 2: Fetch Messages
    console.log('\n--- Test 2: Fetch Messages ---');
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const fetchResult = await ebayService.fetchMessages({
        accessToken: user.ebayCredentials.accessToken,
        environment: user.ebayCredentials.environment,
        startTimeISO: startDate.toISOString(),
        endTimeISO: now.toISOString(),
        page: 1,
        entriesPerPage: 10
      });

      console.log(`✅ Fetch successful. Found ${fetchResult.messages.length} messages`);
      
      if (fetchResult.messages.length > 0) {
        console.log('\n📧 Sample message:');
        const sample = fetchResult.messages[0];
        console.log(`  - ID: ${sample.externalId}`);
        console.log(`  - From: ${sample.senderUsername}`);
        console.log(`  - Subject: ${sample.subject}`);
        console.log(`  - Type: ${sample.senderType}`);
        console.log(`  - System: ${sample.isSystem}`);
        console.log(`  - Item ID: ${sample.itemId}`);
        console.log(`  - Date: ${sample.creationDate}`);
      }

    } catch (error) {
      console.log('❌ Fetch messages failed:', error.message);
      console.log('Full error:', error);
    }

    // Test 3: Check Available APIs
    console.log('\n--- Test 3: API Endpoints Check ---');
    const endpoints = [
      '/commerce/identity/v1/user',
      '/post-order/v2/inquiry/search',
      '/buy/browse/v1/item_summary/search'
    ];

    for (const endpoint of endpoints) {
      try {
        const url = ebayService.getApiUrl(endpoint, user.ebayCredentials.environment);
        console.log(`Testing: ${url}`);
        
        // Simple HEAD request to check if endpoint exists
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${user.ebayCredentials.accessToken}`
          }
        });
        
        console.log(`  Status: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log('\n--- Debug Summary ---');
    console.log('1. Check your eBay Developer Account:');
    console.log('   - Ensure your app is approved for production (if using production)');
    console.log('   - Verify your app has the correct scopes/permissions');
    console.log('   - Check if your tokens are still valid');
    
    console.log('\n2. Common Issues:');
    console.log('   - Sandbox vs Production environment mismatch');
    console.log('   - Insufficient API permissions');
    console.log('   - Expired or invalid tokens');
    console.log('   - Rate limiting');
    
    console.log('\n3. Next Steps:');
    console.log('   - If connection fails, re-authenticate through eBay');
    console.log('   - If no messages found, try different date ranges');
    console.log('   - Check eBay Developer Console for API logs');

  } catch (error) {
    console.log('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the debug
if (require.main === module) {
  debugEbayConnection();
}

module.exports = { debugEbayConnection };