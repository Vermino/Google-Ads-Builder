# Backend API Integration Guide

## Overview

The frontend has been updated to use a **secure backend API server** instead of calling OpenAI/Claude directly from the browser. This architecture provides:

- **Enhanced Security**: API keys are stored securely on the backend server, never exposed to the browser
- **Better Control**: Centralized API key management and usage monitoring
- **Improved Performance**: Backend can implement caching and rate limiting
- **Simplified Frontend**: No need to manage API keys in localStorage or environment variables

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Browser   │ ──────> │   Backend   │ ──────> │  OpenAI /    │
│  (Frontend) │  HTTP   │  API Server │   API   │   Claude     │
└─────────────┘         └─────────────┘         └──────────────┘
                         (Port 3001)
```

### Request Flow

1. **User Action**: User clicks "Generate Ad Copy" in the frontend
2. **Frontend Request**: Frontend sends HTTP POST to `http://localhost:3001/api/ai/generate-copy`
3. **Authentication**: Request includes `Authorization: Bearer <token>` header
4. **Backend Processing**: Backend validates token, calls OpenAI/Claude with stored API keys
5. **Response**: Backend returns generated content to frontend
6. **Display**: Frontend displays the results to user

## Changes Made

### 1. New API Client Service

**File**: `src/services/apiClient.ts`

A new centralized API client that handles all backend communication:

```typescript
import { apiClient } from '@/services/apiClient';

// Generate ad copy
const result = await apiClient.generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food',
  targetKeywords: ['organic dog food'],
  headlineCount: 15,
  descriptionCount: 4,
});

// Research keywords
const keywords = await apiClient.researchKeywords({
  provider: 'openai',
  seedKeywords: ['emergency plumber'],
  businessDescription: '24/7 plumbing service',
  targetLocation: 'Boston',
});

// Check health
await apiClient.checkHealth();

// Get available providers
const providers = await apiClient.getProviders();
```

### 2. Updated AI Service

**File**: `src/services/aiService.ts`

The AI service now routes all requests through the backend API:

**Before** (Direct OpenAI/Claude calls):
```typescript
const openaiClient = new OpenAI({
  apiKey: AI_CONFIG.openai.apiKey,
  dangerouslyAllowBrowser: true, // ❌ Insecure
});
const response = await openaiClient.chat.completions.create({ ... });
```

**After** (Backend API calls):
```typescript
const response = await apiClient.generateAdCopy({
  provider: request.provider,
  businessDescription: request.businessDescription,
  // ... other params
});
```

### 3. Updated Keyword Research Service

**File**: `src/services/keywordResearchService.ts`

Similar update to route keyword research through the backend API while maintaining local fallback functions for keyword expansion.

### 4. Updated AI Settings Component

**File**: `src/components/settings/AISettings.tsx`

The settings page now shows:

- ✅ **Backend API Connection Status**: Real-time connection testing
- ✅ **Available AI Providers**: Which providers (OpenAI, Claude) are configured on the backend
- ✅ **API Endpoint Configuration**: Display of configured backend URL
- ✅ **Authentication Status**: Shows if API token is configured
- ❌ **No API Key Inputs**: API keys are no longer entered in the frontend

### 5. Environment Configuration

**File**: `.env.local` (New Format)

```bash
# Backend API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_TOKEN=b52069d3abc59e4c5e307500894ed99ec60d6315a8e82c279cdbe4a6262d5b15
```

**File**: `.env.local.example` (Updated)

Provides template for new configuration format.

## Configuration

### Frontend Setup

1. **Create `.env.local` file**:
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```

2. **Update environment variables**:
   ```bash
   VITE_API_URL=http://localhost:3001
   VITE_API_TOKEN=your-api-token-here
   ```

   Get the API token from your backend administrator or use the provided token:
   ```
   b52069d3abc59e4c5e307500894ed99ec60d6315a8e82c279cdbe4a6262d5b15
   ```

3. **Restart development server**:
   ```bash
   npm run dev
   ```

### Backend Setup

Ensure the backend API server is running on `http://localhost:3001` with:

1. **OpenAI and/or Claude API keys configured**
2. **Authentication token matching frontend** (`VITE_API_TOKEN`)
3. **CORS enabled** for frontend origin
4. **Required endpoints**:
   - `GET /health` - Health check
   - `GET /api/ai/providers` - List available providers
   - `POST /api/ai/generate-copy` - Generate ad copy
   - `POST /api/keywords/research` - Keyword research
   - `POST /api/keywords/expand` - Keyword expansion

## API Endpoints

### Health Check

**GET** `/health`

```json
{
  "status": "ok",
  "timestamp": "2025-11-01T12:00:00Z"
}
```

### Get Available Providers

**GET** `/api/ai/providers`

```json
{
  "providers": ["openai", "claude"]
}
```

### Generate Ad Copy

**POST** `/api/ai/generate-copy`

**Request**:
```json
{
  "provider": "openai",
  "businessDescription": "Premium organic dog food delivery",
  "targetKeywords": ["organic dog food", "healthy pets"],
  "tone": "professional",
  "callToAction": "Order Today",
  "uniqueSellingPoints": ["Free shipping", "100% organic"],
  "targetAudience": "Dog owners",
  "headlineCount": 15,
  "descriptionCount": 4
}
```

**Response**:
```json
{
  "headlines": [
    "Premium Organic Dog Food",
    "Healthy Pets Start Here",
    ...
  ],
  "descriptions": [
    "100% organic ingredients. Free shipping on all orders. Order today!",
    ...
  ],
  "generatedAt": "2025-11-01T12:00:00Z"
}
```

### Research Keywords

**POST** `/api/keywords/research`

**Request**:
```json
{
  "provider": "openai",
  "seedKeywords": ["emergency plumber"],
  "businessDescription": "24/7 emergency plumbing service",
  "targetLocation": "Boston",
  "maxResults": 100,
  "includeLongTail": true,
  "includeNegativeKeywords": true
}
```

**Response**:
```json
{
  "suggestions": [
    {
      "keyword": "emergency plumber near me",
      "relevanceScore": 85,
      "category": "local",
      "isLongTail": true
    },
    ...
  ],
  "relatedTerms": ["plumbing service", "24/7 plumber", ...],
  "longTailVariations": ["emergency plumber boston ma", ...],
  "negativeKeywords": ["job", "salary", "training", ...]
}
```

## Testing the Integration

### 1. Check API Configuration

Visit **Settings > AI Settings** in the frontend to verify:

- ✅ API endpoint is configured
- ✅ Authentication token is present
- ✅ Connection status is "Connected"
- ✅ Available providers are shown (OpenAI, Claude)

### 2. Test Connection

Click the **"Test"** button in the Connection Status section to verify:

- Backend server is running
- Authentication is working
- Providers are configured

### 3. Generate Ad Copy

1. Navigate to **Campaign Builder**
2. Create a campaign and ad group
3. Click **"Generate with AI"**
4. Fill in business description
5. Click **"Generate"**
6. Verify headlines and descriptions are generated

### 4. Research Keywords

1. Navigate to **Ad Group Builder**
2. Click **"Research Keywords"**
3. Enter seed keywords
4. Click **"Generate Keywords"**
5. Verify keyword suggestions appear

## Error Handling

The integration includes comprehensive error handling:

### Frontend Errors

```typescript
try {
  const result = await apiClient.generateAdCopy(request);
} catch (error) {
  // Error messages are user-friendly
  if (error.message.includes('Failed to connect')) {
    // Show: "Backend server is not running"
  } else if (error.message.includes('401')) {
    // Show: "Invalid API token"
  } else {
    // Show: Generic error message
  }
}
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "API not configured" | Missing `VITE_API_TOKEN` | Add token to `.env.local` |
| "Failed to connect to API server" | Backend not running | Start backend server |
| "Invalid API token" | Wrong token | Update token in `.env.local` |
| "AI provider is not configured on the server" | Backend missing OpenAI/Claude keys | Configure backend API keys |

## Security Considerations

### What Changed?

**Before** (Insecure):
- API keys stored in browser localStorage
- API keys in `.env.local` (could be committed to git)
- Direct API calls from browser (`dangerouslyAllowBrowser: true`)
- API keys visible in browser DevTools

**After** (Secure):
- API keys stored only on backend server
- Frontend only has authentication token
- All API calls proxied through backend
- API keys never exposed to browser

### Best Practices

1. **Never commit `.env.local`** - Added to `.gitignore`
2. **Rotate API tokens regularly** - Update `VITE_API_TOKEN` periodically
3. **Use HTTPS in production** - Update `VITE_API_URL` to use HTTPS
4. **Monitor backend logs** - Track API usage and errors
5. **Implement rate limiting** - Protect backend from abuse

## Migration Checklist

If you're updating an existing installation:

- [x] Update `src/services/aiService.ts`
- [x] Update `src/services/keywordResearchService.ts`
- [x] Create `src/services/apiClient.ts`
- [x] Update `src/components/settings/AISettings.tsx`
- [x] Update `.env.local` with new format
- [x] Update `.env.local.example`
- [x] Remove old API keys from localStorage
- [x] Start backend API server
- [x] Test connection in Settings
- [x] Test ad generation
- [x] Test keyword research

## Troubleshooting

### Backend Not Connecting

**Symptoms**: "Failed to connect to API server" error

**Solutions**:
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check CORS is enabled on backend
3. Verify port 3001 is not blocked by firewall
4. Check backend logs for errors

### Authentication Failing

**Symptoms**: "Invalid API token" or 401 errors

**Solutions**:
1. Verify token in `.env.local` matches backend
2. Check token has no extra spaces or line breaks
3. Restart frontend dev server after changing `.env.local`
4. Verify backend authentication middleware is working

### No Providers Available

**Symptoms**: "AI provider is not configured on the server"

**Solutions**:
1. Check backend has OpenAI and/or Claude API keys
2. Verify backend can connect to OpenAI/Claude APIs
3. Review backend startup logs
4. Test backend API keys manually

## Development Workflow

### Running Locally

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   # Backend runs on http://localhost:3001
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Verify Connection**:
   - Open http://localhost:5173
   - Navigate to Settings > AI Settings
   - Click "Test Connection"
   - Should see "Connected" status

### Making API Changes

If you need to add new AI features:

1. **Add endpoint to backend** (`backend/src/routes/ai.ts`)
2. **Add method to apiClient** (`frontend/src/services/apiClient.ts`)
3. **Update service** (`frontend/src/services/aiService.ts` or `keywordResearchService.ts`)
4. **Update types** (TypeScript interfaces)
5. **Test integration**

## Support

For issues or questions:

1. Check backend server logs
2. Check frontend browser console
3. Verify `.env.local` configuration
4. Test endpoints manually with curl/Postman
5. Review this documentation

## Summary

The frontend has been successfully updated to use the secure backend API architecture. All AI operations now flow through the backend server, keeping API keys secure and providing a more robust, scalable solution.

**Key Benefits**:
- ✅ Enhanced security (no API keys in browser)
- ✅ Centralized API key management
- ✅ Better error handling and logging
- ✅ Rate limiting and caching capabilities
- ✅ Easier to scale and monitor
