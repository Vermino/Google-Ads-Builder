import express from 'express';
import { google } from 'googleapis';
import { config } from '../config/config.js';

const router = express.Router();

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/sheets-oauth/callback'
);

/**
 * GET /api/sheets-oauth/auth-url
 * Get Google OAuth URL for user authorization
 */
router.get('/auth-url', (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sheets-oauth/callback
 * Handle OAuth callback from Google
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('No authorization code provided');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Store tokens temporarily (in production, store in database)
    const tokenId = 'token-' + Date.now();
    global.tempTokens = global.tempTokens || {};
    (global as any).tempTokens[tokenId] = tokens;

    // Send HTML that closes popup and sends token to parent window
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              stroke-width: 4;
              stroke: #fff;
              stroke-miterlimit: 10;
              margin: 0 auto 20px;
              box-shadow: inset 0px 0px 0px #7ac142;
              animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
            }
            .checkmark__circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-width: 4;
              stroke-miterlimit: 10;
              stroke: #7ac142;
              fill: none;
              animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke {
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
            @keyframes fill {
              100% { box-shadow: inset 0px 0px 0px 30px #7ac142; }
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { font-size: 16px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h1>✓ Authorization Successful!</h1>
            <p>Creating your Google Sheet...</p>
            <p style="font-size: 14px; margin-top: 20px;">This window will close automatically.</p>
          </div>
          <script>
            (function() {
              // Send message to parent window
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                  { type: 'SHEETS_AUTH_SUCCESS', tokenId: '${tokenId}' },
                  '*'
                );
                // Focus parent window
                window.opener.focus();
                // Try to close after a delay (gives time for message to be received)
                setTimeout(function() {
                  window.close();
                  // If close didn't work, show manual close message
                  setTimeout(function() {
                    document.querySelector('p').textContent = 'You can close this window now.';
                  }, 500);
                }, 1000);
              } else {
                // Fallback: redirect to main app
                window.location.href = '${process.env.CLIENT_URL || 'http://localhost:5173'}/automation?sheetsAuth=${tokenId}';
              }
            })();
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

/**
 * POST /api/sheets-oauth/create-spreadsheet
 * Create a new Google Sheet with proper structure
 */
router.post('/create-spreadsheet', async (req, res) => {
  try {
    const { tokenId, accountId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    // Retrieve tokens
    const tokens = (global as any).tempTokens?.[tokenId];
    if (!tokens) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    oauth2Client.setCredentials(tokens);

    // Create sheets API client
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Create spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Google Ads Data - ${accountId || 'Account'} - ${new Date().toLocaleDateString()}`
        },
        sheets: [
          { properties: { title: 'Summary' } },
          { properties: { title: 'Campaigns' } },
          { properties: { title: 'Keywords' } },
          { properties: { title: 'SearchTerms' } },
          { properties: { title: 'Ads' } }
        ]
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

    // Get the actual sheet IDs from the created spreadsheet
    const createdSheets = spreadsheet.data.sheets || [];
    const sheetIds = createdSheets.map((sheet: any) => sheet.properties.sheetId);

    // Set up headers for each sheet using actual IDs
    await setupSheetHeaders(sheets, spreadsheetId!, sheetIds);

    // Clean up token after use
    delete (global as any).tempTokens[tokenId];

    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      message: 'Spreadsheet created successfully'
    });
  } catch (error: any) {
    console.error('Error creating spreadsheet:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set up headers for each sheet
 */
async function setupSheetHeaders(sheets: any, spreadsheetId: string, sheetIds: number[]) {
  const requests = [];

  // Summary sheet headers (first sheet)
  if (sheetIds[0] !== undefined) {
    requests.push({
      updateCells: {
        range: { sheetId: sheetIds[0], startRowIndex: 0, endRowIndex: 1 },
        rows: [{
          values: [
            { userEnteredValue: { stringValue: 'Metric' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Value' }, userEnteredFormat: { textFormat: { bold: true } } }
          ]
        }],
        fields: 'userEnteredValue,userEnteredFormat.textFormat.bold'
      }
    });
  }

  // Campaigns sheet headers (second sheet)
  if (sheetIds[1] !== undefined) {
    requests.push({
      updateCells: {
        range: { sheetId: sheetIds[1], startRowIndex: 0, endRowIndex: 1 },
        rows: [{
          values: [
            { userEnteredValue: { stringValue: 'Campaign ID' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Name' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Status' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Budget' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Impressions' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Clicks' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Cost' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Conversions' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'CTR' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Avg CPC' }, userEnteredFormat: { textFormat: { bold: true } } }
          ]
        }],
        fields: 'userEnteredValue,userEnteredFormat.textFormat.bold'
      }
    });
  }

  // Keywords sheet headers (third sheet)
  if (sheetIds[2] !== undefined) {
    requests.push({
      updateCells: {
        range: { sheetId: sheetIds[2], startRowIndex: 0, endRowIndex: 1 },
        rows: [{
          values: [
            { userEnteredValue: { stringValue: 'Keyword ID' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Campaign' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Ad Group' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Text' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Match Type' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Status' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'QS' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Max CPC' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Impressions' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Clicks' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Cost' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Conv' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'CTR' }, userEnteredFormat: { textFormat: { bold: true } } }
          ]
        }],
        fields: 'userEnteredValue,userEnteredFormat.textFormat.bold'
      }
    });
  }

  // SearchTerms sheet headers (fourth sheet)
  if (sheetIds[3] !== undefined) {
    requests.push({
      updateCells: {
        range: { sheetId: sheetIds[3], startRowIndex: 0, endRowIndex: 1 },
        rows: [{
          values: [
            { userEnteredValue: { stringValue: 'Query' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Campaign' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Ad Group' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Impressions' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Clicks' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Cost' }, userEnteredFormat: { textFormat: { bold: true } } },
            { userEnteredValue: { stringValue: 'Conversions' }, userEnteredFormat: { textFormat: { bold: true } } }
          ]
        }],
        fields: 'userEnteredValue,userEnteredFormat.textFormat.bold'
      }
    });
  }

  // Apply all header updates (only if there are requests)
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }
}

export default router;
