// Create this file as: backend/debug/detailedEbayDebug.js
const mongoose = require('mongoose');
const User = require('../src/models/User');
const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();

class DetailedEbayDebug {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: true,
      mergeAttrs: false,
      explicitCharkey: false,
      charkey: 'value'
    });
  }

  async parseXMLResponse(xmlData) {
    try {
      return await this.parser.parseStringPromise(xmlData);
    } catch (error) {
      console.log('❌ XML parsing error:', error.message);
      console.log('Raw XML data:', xmlData.substring(0, 500) + '...');
      throw error;
    }
  }

  buildTradingXML(callName, token, body, environment = 'sandbox') {
    return `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  ${body}
</${callName}Request>`;
  }

  getTradingUrl(environment) {
    return environment === 'production' 
      ? 'https://api.ebay.com/ws/api'
      : 'https://api.sandbox.ebay.com/ws/api';
  }

  async testTradingAPICall(callName, token, body, environment) {
    console.log(`\n--- Testing ${callName} ---`);
    console.log(`Environment: ${environment}`);
    console.log(`URL: ${this.getTradingUrl(environment)}`);
    console.log(`Token (first 20 chars): ${token.substring(0, 20)}...`);

    try {
      const xml = this.buildTradingXML(callName, token, body, environment);
      console.log(`Request XML:\n${xml.substring(0, 300)}...`);

      const response = await axios.post(this.getTradingUrl(environment), xml, {
        headers: {
          'Content-Type': 'text/xml',
          'X-EBAY-API-SITEID': '0',
          'X-EBAY-API-COMPATIBILITY-LEVEL': '1285',
          'X-EBAY-API-CALL-NAME': callName
        },
        timeout: 30000
      });

      console.log(`✅ HTTP Status: ${response.status}`);
      console.log(`Response length: ${response.data.length} chars`);
      
      const result = await this.parseXMLResponse(response.data);
      const responseKey = `${callName}Response`;
      
      if (result[responseKey]) {
        const apiResponse = result[responseKey];
        const ack = apiResponse.Ack ? apiResponse.Ack[0] : 'Unknown';
        console.log(`API Ack: ${ack}`);

        if (ack === 'Success' || ack === 'Warning') {
          console.log('✅ API call succeeded');
          
          // Show specific data based on call type
          if (callName === 'GetUser' && apiResponse.User) {
            console.log(`User ID: ${apiResponse.User[0].UserID[0]}`);
            console.log(`Registration Date: ${apiResponse.User[0].RegistrationDate[0]}`);
          } else if (callName === 'GetMyMessages' && apiResponse.Messages) {
            console.log(`Messages found: ${apiResponse.Messages.length}`);
            if (apiResponse.Messages.length > 0) {
              const firstMsg = apiResponse.Messages[0].Message[0];
              console.log(`First message ID: ${firstMsg.MessageID[0]}`);
              console.log(`First message subject: ${firstMsg.Subject ? firstMsg.Subject[0] : 'No subject'}`);
            }
          } else if (callName === 'GetMemberMessages' && apiResponse.MemberMessage) {
            console.log(`Member messages found: ${apiResponse.MemberMessage.length}`);
          }
          
          return { success: true, data: apiResponse };
        } else {
          console.log('❌ API call failed');
          
          if (apiResponse.Errors) {
            console.log('\n🚨 eBay API Errors:');
            apiResponse.Errors.forEach((error, index) => {
              console.log(`  Error ${index + 1}:`);
              console.log(`    Code: ${error.ErrorCode ? error.ErrorCode[0] : 'Unknown'}`);
              console.log(`    Severity: ${error.SeverityCode ? error.SeverityCode[0] : 'Unknown'}`);
              console.log(`    Message: ${error.LongMessage ? error.LongMessage[0] : error.ShortMessage ? error.ShortMessage[0] : 'No message'}`);
              
              // Provide specific guidance based on error codes
              this.explainError(error.ErrorCode ? error.ErrorCode[0] : null);
            });
          }
          
          return { success: false, errors: apiResponse.Errors };
        }
      } else {
        console.log('❌ Unexpected response structure');
        console.log('Response keys:', Object.keys(result));
        return { success: false, error: 'Unexpected response structure' };
      }

    } catch (error) {
      console.log('❌ Request failed:', error.message);
      
      if (error.response) {
        console.log(`HTTP Status: ${error.response.status}`);
        console.log(`Response data: ${error.response.data.substring(0, 500)}...`);
      }
      
      return { success: false, error: error.message };
    }
  }

  explainError(errorCode) {
    const errorExplanations = {
      '931': '🔑 Invalid token - Your eBay auth token is expired or invalid',
      '932': '🔑 Invalid token - Your eBay auth token format is incorrect',
      '17': '🚫 Insufficient permissions - Your app lacks required permissions',
      '21919': '📞 API call not supported - This API call is not available for your account type',
      '118': '📋 No data found - No messages match your criteria',
      '2': '📝 Invalid input - Check your request parameters',
      '127': '🕒 Request timeout - eBay servers are busy, try again',
      '1': '🔧 Internal error - eBay API issue, try again later'
    };

    if (errorCode && errorExplanations[errorCode]) {
      console.log(`    💡 ${errorExplanations[errorCode]}`);
    }
  }

  async runFullDiagnostic() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ebay_store_manager');
      console.log('✅ Connected to MongoDB');

      const user = await User.findOne({ 
        'ebayCredentials.accessToken': { $exists: true } 
      });

      if (!user) {
        console.log('❌ No user found with eBay credentials');
        return;
      }

      console.log(`\n🔍 Full eBay API Diagnostic for: ${user.email}`);
      console.log(`Environment: ${user.ebayCredentials.environment || 'sandbox'}`);
      console.log(`Token expires: ${user.ebayCredentials.tokenExpires || 'Unknown'}`);

      const { accessToken, environment } = user.ebayCredentials;

      // Test 1: Basic connection with GetUser
      const userTest = await this.testTradingAPICall('GetUser', accessToken, '', environment);
      
      if (!userTest.success) {
        console.log('\n🛑 GetUser failed - cannot proceed with other tests');
        console.log('This usually means your token is invalid or expired');
        return;
      }

      // Test 2: GetMyMessages with minimal parameters
      const myMessagesTest = await this.testTradingAPICall(
        'GetMyMessages', 
        accessToken, 
        '<DetailLevel>ReturnAll</DetailLevel>', 
        environment
      );

      // Test 3: GetMyMessages with date range (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const myMessagesWithDateTest = await this.testTradingAPICall(
        'GetMyMessages',
        accessToken,
        `
        <StartTime>${thirtyDaysAgo.toISOString()}</StartTime>
        <EndTime>${new Date().toISOString()}</EndTime>
        <DetailLevel>ReturnAll</DetailLevel>
        <Pagination>
          <EntriesPerPage>10</EntriesPerPage>
          <PageNumber>1</PageNumber>
        </Pagination>
        `,
        environment
      );

      // Test 4: GetMemberMessages
      const memberMessagesTest = await this.testTradingAPICall(
        'GetMemberMessages',
        accessToken,
        `
        <MemberMessageType>All</MemberMessageType>
        <MessageStatus>All</MessageStatus>
        <DetailLevel>ReturnAll</DetailLevel>
        `,
        environment
      );

      // Summary
      console.log('\n📊 DIAGNOSTIC SUMMARY:');
      console.log(`GetUser: ${userTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`GetMyMessages (basic): ${myMessagesTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`GetMyMessages (with dates): ${myMessagesWithDateTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`GetMemberMessages: ${memberMessagesTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);

      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      
      if (!userTest.success) {
        console.log('1. 🔑 Get a new eBay auth token - your current token is invalid');
        console.log('2. 🔄 Try switching between sandbox/production environments');
      } else if (!myMessagesTest.success && !memberMessagesTest.success) {
        console.log('1. 📋 Your account may have no messages to retrieve');
        console.log('2. 🔒 Your eBay app may lack messaging permissions');
        console.log('3. 🏪 Try testing with an eBay seller account that has actual messages');
      } else if (myMessagesTest.success || memberMessagesTest.success) {
        console.log('1. ✅ At least one messaging API works!');
        console.log('2. 🔧 Update your sync code to use the working API');
      }

    } catch (error) {
      console.log('❌ Diagnostic failed:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('\n✅ Disconnected from MongoDB');
    }
  }
}

// Run the diagnostic
if (require.main === module) {
  const debug = new DetailedEbayDebug();
  debug.runFullDiagnostic();
}

module.exports = DetailedEbayDebug;