# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for the "Connect Google Sheets" feature in the Script Setup.

## Why OAuth?

Instead of manually creating a Google Sheet and copying the ID, users can click **"Connect Google Sheets"** which:
1. Opens Google OAuth popup
2. User authorizes the app
3. App automatically creates a Google Sheet
4. App configures the sheet with proper headers
5. Sheet ID is auto-filled in the form
6. User gets a direct link to their new sheet

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Google Ads Builder`
4. Click **"Create"**

### 2. Enable Required APIs

1. In the Google Cloud Console, select your project
2. Go to **"APIs & Services"** → **"Library"**
3. Search for and enable these APIs:
   - **Google Sheets API**
   - **Google Drive API**

### 3. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: `Google Ads Builder`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"**
   - Scopes: Skip for now (click "Save and Continue")
   - Test users: Add your Google email
   - Click **"Save and Continue"**

4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Google Ads Builder`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3001`
   - Authorized redirect URIs:
     - `http://localhost:3001/api/sheets-oauth/callback`
   - Click **"Create"**

5. Copy the **Client ID** and **Client Secret**

### 4. Update .env File

Add to your `server/.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/sheets-oauth/callback
CLIENT_URL=http://localhost:5173
```

Replace `your-client-id-here` and `your-client-secret-here` with the values from step 3.

### 5. Restart the Backend

```bash
cd server
npm run dev
```

### 6. Test the Feature

1. Open frontend: `http://localhost:5173/automation`
2. Go to **"Script Setup"** tab
3. Click **"Connect Google Sheets"**
4. Google OAuth popup should open
5. Sign in and authorize the app
6. Sheet should be created automatically
7. Sheet ID should be filled in automatically
8. Click the "View your Google Sheet" link to see it

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Make sure redirect URI is **exactly**: `http://localhost:3001/api/sheets-oauth/callback`
4. Save and try again

### Error: "Access blocked: This app's request is invalid"

**Problem:** The OAuth consent screen isn't properly configured.

**Solution:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure your email is added as a test user
3. Publishing status should be "Testing"
4. Try again

### Error: "The API returned an error: Request had insufficient authentication scopes"

**Problem:** Required scopes aren't granted.

**Solution:**
1. The app requests these scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
2. Go through OAuth flow again
3. Make sure to click "Allow" for all permissions

### Button Does Nothing

**Problem:** OAuth credentials not configured in .env file.

**Solution:**
1. Check server console for errors
2. Make sure `.env` file has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Restart the backend server

## Production Setup

For production deployment:

1. Change OAuth redirect URI to your production domain:
   ```
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/sheets-oauth/callback
   CLIENT_URL=https://yourdomain.com
   ```

2. Add production domains to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/sheets-oauth/callback`

3. Publish the OAuth consent screen (optional):
   - Go to OAuth consent screen
   - Click "Publish App"
   - Note: For internal use, you can keep it in "Testing" mode

## How It Works

### Flow Diagram

```
User clicks "Connect Google Sheets"
         ↓
Frontend requests OAuth URL from backend
         ↓
Backend generates Google OAuth URL
         ↓
Frontend opens popup with OAuth URL
         ↓
User signs in and authorizes
         ↓
Google redirects to: /api/sheets-oauth/callback?code=xyz
         ↓
Backend exchanges code for access token
         ↓
Backend stores token temporarily
         ↓
Backend redirects to: /automation?sheetsAuth=token123
         ↓
Frontend detects sheetsAuth parameter
         ↓
Frontend calls: /api/sheets-oauth/create-spreadsheet
         ↓
Backend uses token to create Google Sheet
         ↓
Backend configures sheet with proper structure
         ↓
Backend returns spreadsheet ID and URL
         ↓
Frontend auto-fills Sheet ID field
         ↓
User sees "View your Google Sheet" link
         ↓
Done! ✅
```

### What Gets Created

The app creates a Google Sheet with these tabs:
- **Summary** - Sync status and counts
- **Campaigns** - All campaign data and metrics
- **Keywords** - All keywords with performance data
- **SearchTerms** - Search query report
- **Ads** - All ad copy and performance

Each tab has proper headers and is ready to receive data from the Google Ads Script.

## Security Notes

- Access tokens are stored temporarily in memory (not database)
- Tokens are deleted after spreadsheet creation
- Only grants minimal scopes (sheets and drive.file)
- OAuth credentials should be kept secret
- Add `.env` to `.gitignore` (already done)

## Benefits of OAuth Approach

✅ **No manual sheet creation** - Automatic
✅ **No copying Sheet IDs** - Auto-filled
✅ **Proper structure** - Pre-configured headers
✅ **Direct link** - Quick access to sheet
✅ **Better UX** - One click instead of 5+ steps
✅ **Less errors** - No typos in Sheet ID
