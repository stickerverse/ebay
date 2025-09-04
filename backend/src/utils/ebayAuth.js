const axios = require('axios');

class EbayAuth {
  static async generateAuthUrl(clientId, environment = 'sandbox') {
    const baseUrl = environment === 'production' 
      ? 'https://auth.ebay.com/oauth2/authorize'
      : 'https://auth.sandbox.ebay.com/oauth2/authorize';
    
    const scopes = [
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
      scope: scopes,
      state: 'your-state-value'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  static async exchangeCodeForTokens(code, clientId, clientSecret, environment = 'sandbox') {
    const baseUrl = environment === 'production' 
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    try {
      const response = await axios.post(baseUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }
}

module.exports = EbayAuth;
