const express = require('express');
const axios = require('axios');

const app = express();
const port = 8080;

const CLIENT_ID = 'StephenK-test-PRD-d9d78966a-e0426fc9';
const CLIENT_SECRET = 'PRD-9d78966a16f0-abfa-4dd3-a2fb-8fa3';
const REDIRECT_URI = 'Stephen_Kirk-StephenK-test-P-byrfput';

const SCOPES = [
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
].join(' ');

app.get('/', (req, res) => {
  const authUrl = `https://auth.ebay.com/oauth2/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `state=your_unique_state_value`;

  res.send(`
    <h1>eBay OAuth Token Generator</h1>
    <h2>Step 1: Get Authorization Code</h2>
    <p>Click the link below to authorize your application with eBay:</p>
    <p><a href="${authUrl}" target="_blank" style="background: #0064d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Authorize with eBay</a></p>
    
    <h2>Step 2: Extract the Code</h2>
    <p>After clicking the link above:</p>
    <ol>
      <li>You'll be redirected to eBay's login page</li>
      <li>Log in with your eBay account</li>
      <li>Grant the requested permissions</li>
      <li>eBay will redirect you to a page that might show an error (that's normal)</li>
      <li><strong>Look at the URL bar</strong> - it will contain a "code" parameter</li>
      <li>Copy everything after "code=" and before "&" (if there is one)</li>
    </ol>
    
    <h2>Step 3: Exchange Code for Tokens</h2>
    <form action="/exchange" method="post">
      <input type="text" name="code" placeholder="Paste authorization code here" style="width: 500px; padding: 10px; font-family: monospace;">
      <br><br>
      <button type="submit" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px;">Get Tokens</button>
    </form>
    
    <h3>Example of what to look for in the URL:</h3>
    <p style="background: #f8f9fa; padding: 10px; font-family: monospace; word-break: break-all;">
      https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&runame=Stephen_Kirk-StephenK-test-P-byrfput&SessID=...&<strong>code=v%5E1.1%23i%5E1%23...</strong>&expires_in=300
    </p>
    <p>Copy only the part after "code=" (the long string)</p>
  `);
});

app.use(express.urlencoded({ extended: true }));

app.post('/exchange', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.send('<h2>Error: No authorization code provided</h2><a href="/">Try again</a>');
  }

  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    console.log('Exchanging code for tokens...');
    console.log('Code:', code.substring(0, 50) + '...');
    
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: decodeURIComponent(code), // URL decode the code
        redirect_uri: REDIRECT_URI
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      });

    const tokens = response.data;
    
    console.log('Success! Tokens received');
    
    res.send(`
      <h1>🎉 Success! Your eBay Tokens:</h1>
      <div style="background: #d4edda; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #c3e6cb;">
        <h3>Access Token:</h3>
        <textarea style="width: 100%; height: 80px; font-family: monospace;" readonly>${tokens.access_token}</textarea>
        
        <h3>Refresh Token:</h3>
        <textarea style="width: 100%; height: 80px; font-family: monospace;" readonly>${tokens.refresh_token}</textarea>
        
        <h3>Token Details:</h3>
        <p><strong>Access Token Expires:</strong> ${tokens.expires_in} seconds (${Math.round(tokens.expires_in/3600)} hours)</p>
        <p><strong>Refresh Token Expires:</strong> ${tokens.refresh_token_expires_in} seconds (${Math.round(tokens.refresh_token_expires_in/86400)} days)</p>
      </div>
      
      <div style="background: #cce5ff; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h3>Next Steps:</h3>
        <ol>
          <li>Copy the <strong>Access Token</strong> and <strong>Refresh Token</strong> above</li>
          <li>Go to your eBay Store Manager: <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></li>
          <li>Login with: admin@test.com / admin123</li>
          <li>Navigate to <strong>Settings → eBay Credentials</strong></li>
          <li>Fill in:
            <ul>
              <li>Client ID: StephenK-test-PRD-d9d78966a-e0426fc9</li>
              <li>Client Secret: PRD-9d78966a16f0-abfa-4dd3-a2fb-8fa3</li>
              <li>Access Token: (paste from above)</li>
              <li>Refresh Token: (paste from above)</li>
              <li>Environment: <strong>production</strong></li>
            </ul>
          </li>
          <li>Click <strong>Save Credentials</strong></li>
        </ol>
      </div>
    `);

  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.send(`
      <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h2>Error exchanging code for tokens:</h2>
        <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
        <p><a href="/">← Try again</a></p>
      </div>
    `);
  }
});

app.listen(port, () => {
  console.log(`\n🚀 eBay Token Generator running at http://localhost:${port}`);
  console.log(`Open this URL in your browser to get your eBay tokens\n`);
});
