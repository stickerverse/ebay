const express = require('express');
const axios = require('axios');

const app = express();
const port = 8080;

const CLIENT_ID = 'StephenK-test-PRD-d9d78966a-e0426fc9';
const CLIENT_SECRET = 'PRD-9d78966a16f0-abfa-4dd3-a2fb-8fa3';
const REDIRECT_URI = 'Stephen_Kirk-StephenK-test-P-byrfput';

// --- THIS IS THE UPDATED AND CORRECTED LIST OF SCOPES ---
const SCOPES = [
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
].join(' ');

app.get('/', (req, res) => {
  const authUrl = `https://auth.ebay.com/oauth2/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=${encodeURIComponent(SCOPES)}`;

  res.send(`
    <h1>eBay OAuth Token Generator (Correct Scopes)</h1>
    <h2>Step 1: Authorize with New Permissions</h2>
    <p>Click the link below. You will be asked to grant a <strong>new, expanded set of permissions</strong> to the application.</p>
    <p><a href="${authUrl}" target="_blank" style="background: #0064d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Authorize with eBay (New Scopes)</a></p>
    
    <h2>Step 2: Get the Authorization Code</h2>
    <p>After you log in and click 'Agree' on the new consent screen, copy the 'code' from the URL bar.</p>
    
    <h2>Step 3: Get Your New Tokens</h2>
    <form action="/exchange" method="post">
      <input type="text" name="code" placeholder="Paste new authorization code here" style="width: 500px; padding: 10px; font-family: monospace;">
      <br><br>
      <button type="submit" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px;">Get New Tokens</button>
    </form>
  `);
});

app.use(express.urlencoded({ extended: true }));

app.post('/exchange', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.send('<h2>Error: No code provided</h2><a href="/">Try again</a>');
  }

  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: decodeURIComponent(code),
        redirect_uri: REDIRECT_URI
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      });

    const tokens = response.data;
    
    res.send(`
      <h1>🎉 Success! Here are your NEW tokens:</h1>
      <p>Your old tokens are now invalid. Use these new ones.</p>
      <div style="background: #d4edda; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3>Access Token:</h3>
        <textarea style="width: 100%; height: 80px;" readonly>${tokens.access_token}</textarea>
        <h3>Refresh Token:</h3>
        <textarea style="width: 100%; height: 80px;" readonly>${tokens.refresh_token}</textarea>
      </div>
      <h3>Next Steps:</h3>
      <ol>
        <li>Go back to your eBay Store Manager application.</li>
        <li>Navigate to <strong>Settings → eBay Credentials</strong>.</li>
        <li>Delete your old tokens and paste these <strong>new</strong> ones.</li>
        <li>Ensure 'Environment' is set to 'production' and click <strong>Save Credentials</strong>.</li>
        <li>Go to the dashboard and try syncing messages again.</li>
      </ol>
    `);
  } catch (error) {
    res.send(`
      <div style="background: #f8d7da; padding: 20px;">
        <h2>Error exchanging code:</h2>
        <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
        <p><a href="/">← Try again</a></p>
      </div>
    `);
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Token generator with correct scopes is running at http://localhost:${port}`);
});
