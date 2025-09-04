const axios = require('axios');
const logger = require('../utils/logger');

class EbayService {
  constructor() {
    this.endpoints = {
      sandbox: {
        base: 'https://api.sandbox.ebay.com',
        auth: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      },
      production: {
        base: 'https://api.ebay.com',
        auth: 'https://api.ebay.com/identity/v1/oauth2/token'
      }
    };
  }

  getApiUrl(path, environment = 'sandbox') {
    const baseUrl = this.endpoints[environment].base;
    return `${baseUrl}${path}`;
  }

  async testConnection(accessToken, environment = 'sandbox') {
    try {
      const url = this.getApiUrl('/commerce/identity/v1/user', environment);
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      return response.status === 200 && response.data.username;
    } catch (error) {
      logger.error('eBay connection test failed:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        throw new Error('INVALID_TOKEN');
      }
      return false;
    }
  }

  async fetchMessages(accessToken, environment = 'sandbox', limit = 50, offset = 0) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const params = new URLSearchParams({
        limit,
        offset,
        sort: 'creationDate:desc',
        filter: `creationdate:[${thirtyDaysAgo.toISOString()}..]`
      });

      const url = this.getApiUrl('/post-order/v2/inquiry/search', environment);
      logger.info(`Fetching eBay messages from URL: ${url}?${params.toString()}`);

      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('eBay fetch messages failed:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        throw new Error('INVALID_TOKEN');
      }
      if (error.response?.status === 404) {
        return { inquiries: [] };
      }
      throw error;
    }
  }

  async sendResponse(inquiryId, responseText, accessToken, environment = 'sandbox') {
    try {
      const url = this.getApiUrl(`/post-order/v2/inquiry/${inquiryId}/send_message`, environment);
      logger.info(`Sending response to inquiry ${inquiryId}`);

      const response = await axios.post(
        url,
        { message: { content: responseText } },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('eBay send response failed:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }
}

module.exports = new EbayService();
