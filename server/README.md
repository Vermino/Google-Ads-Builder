# Google Ads Campaign Builder API Server

Secure backend API proxy for AI-powered ad copy generation and keyword research. This server keeps API keys safe on the backend while providing authenticated endpoints for the frontend application.

## Features

- **Secure AI Proxy**: Keeps OpenAI and Claude API keys server-side
- **Token Authentication**: Bearer token authentication for all API endpoints
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **Multiple AI Providers**: Support for OpenAI GPT-4 and Claude Sonnet
- **Comprehensive Error Handling**: Structured error responses with detailed codes
- **TypeScript**: Fully typed API with strict type checking
- **Production Ready**: Helmet security, CORS, request logging, graceful shutdown

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI SDKs**: OpenAI SDK, Anthropic SDK
- **Security**: Helmet, CORS, express-rate-limit
- **Dev Tools**: tsx (TypeScript execution), nodemon (hot reload)

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Generate a secure authentication token:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env` and add:

```env
# Required: At least one AI provider
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Required: Authentication token (use the generated token above)
API_AUTH_TOKEN=<your-generated-token>

# Optional: Customize other settings
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001` (or your configured PORT).

### 4. Test the API

Check health:
```bash
curl http://localhost:3001/health
```

Test authentication:
```bash
curl -X POST http://localhost:3001/api/ai/generate-copy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "provider": "openai",
    "businessDescription": "Premium organic dog food delivery service",
    "headlineCount": 5,
    "descriptionCount": 2
  }'
```

## API Endpoints

### Health & Info

#### GET /health
Server health check

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-01T10:00:00.000Z",
    "version": "1.0.0",
    "aiProviders": {
      "available": ["openai", "claude"],
      "openai": true,
      "claude": true
    }
  }
}
```

#### GET /
API information and documentation

### AI Copy Generation

All AI endpoints require authentication:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

#### POST /api/ai/generate-copy
Generate complete ad copy (headlines + descriptions)

**Request:**
```json
{
  "provider": "openai",
  "businessDescription": "Premium organic dog food delivery service",
  "targetKeywords": ["organic dog food", "healthy dog food", "dog food delivery"],
  "tone": "professional",
  "callToAction": "Order Today",
  "uniqueSellingPoints": ["100% organic", "Free shipping", "Vet approved"],
  "targetAudience": "Health-conscious dog owners",
  "headlineCount": 15,
  "descriptionCount": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "headlines": [
      "Premium Organic Dog Food",
      "Healthy Dog Food Delivered",
      "Vet-Approved Dog Nutrition",
      ...
    ],
    "descriptions": [
      "100% organic ingredients. Free shipping on all orders. Your dog deserves the best!",
      "Vet-approved nutrition delivered to your door. Order today and save 20%!",
      ...
    ],
    "generatedAt": "2025-11-01T10:00:00.000Z",
    "provider": "openai"
  },
  "timestamp": "2025-11-01T10:00:00.000Z"
}
```

#### GET /api/ai/providers
Get available AI providers

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": ["openai", "claude"],
    "default": "openai"
  }
}
```

#### GET /api/ai/health
Check AI service health

### Keyword Research

#### POST /api/keywords/research
Perform comprehensive keyword research

**Request:**
```json
{
  "provider": "openai",
  "seedKeywords": ["plumbing", "emergency plumber"],
  "businessDescription": "24/7 emergency plumbing service",
  "targetLocation": "Boston",
  "maxResults": 100,
  "includeLongTail": true,
  "includeNegativeKeywords": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "keyword": "emergency plumber near me",
        "matchTypes": { "exact": true, "phrase": true, "broad": false },
        "relevanceScore": 95,
        "category": "local",
        "isLongTail": true
      },
      ...
    ],
    "relatedTerms": ["plumbing repair", "24/7 plumber", ...],
    "longTailVariations": ["emergency plumber in Boston", ...],
    "negativeKeywords": ["diy", "free", "job", ...],
    "researchedAt": "2025-11-01T10:00:00.000Z",
    "provider": "openai"
  }
}
```

#### POST /api/keywords/expand
Quick keyword expansion (no AI, faster)

**Request:**
```json
{
  "keywords": ["dog food"],
  "maxVariations": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expanded": [
      "best dog food",
      "dog food online",
      "buy dog food",
      "dog food near me",
      ...
    ],
    "count": 20
  }
}
```

#### POST /api/keywords/negative
Generate negative keyword suggestions

**Request:**
```json
{
  "keywords": ["premium dog food", "organic dog treats"],
  "businessType": "ecommerce"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "negativeKeywords": ["free", "diy", "cheap", "job", ...],
    "count": 25
  }
}
```

## Authentication

All API endpoints (except `/health` and `/`) require Bearer token authentication:

```bash
curl -X POST http://localhost:3001/api/ai/generate-copy \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","businessDescription":"..."}'
```

### Multiple Tokens

Support multiple clients by using `API_AUTH_TOKENS` in `.env`:

```env
API_AUTH_TOKENS=prod-token-abc123,dev-token-xyz789,staging-token-456def
```

## Rate Limiting

Default rate limits:
- **Standard endpoints**: 100 requests per 15 minutes per IP
- **AI endpoints**: 20 requests per 15 minutes per IP (more strict)

Configure in `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

Rate limit headers are included in responses:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1699000000
```

## Error Handling

All errors return structured JSON responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "businessDescription is required",
    "details": {
      "field": "businessDescription",
      "hint": "Provide a description of the business or product"
    }
  },
  "timestamp": "2025-11-01T10:00:00.000Z",
  "requestId": "req_1699000000"
}
```

### Error Codes

- `AUTH_REQUIRED` - No authentication token provided
- `INVALID_TOKEN` - Invalid or expired token
- `VALIDATION_ERROR` - Request validation failed
- `PROVIDER_NOT_CONFIGURED` - AI provider not configured on server
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `TIMEOUT` - AI request timed out
- `API_ERROR` - AI service error
- `INTERNAL_ERROR` - Unexpected server error

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `ALLOWED_ORIGINS` | No | `localhost:*` | CORS allowed origins (comma-separated) |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key (starts with `sk-`) |
| `ANTHROPIC_API_KEY` | Yes* | - | Claude API key (starts with `sk-ant-`) |
| `API_AUTH_TOKEN` | Yes** | - | Single auth token |
| `API_AUTH_TOKENS` | Yes** | - | Multiple tokens (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `OPENAI_MODEL` | No | `gpt-4-turbo-preview` | OpenAI model |
| `CLAUDE_MODEL` | No | `claude-3-5-sonnet-20241022` | Claude model |
| `MAX_TOKENS` | No | `500` | Max AI response tokens |
| `TEMPERATURE` | No | `0.7` | AI temperature (0.0-1.0) |
| `API_TIMEOUT_MS` | No | `30000` | AI request timeout (30 sec) |
| `LOG_LEVEL` | No | `info` | Log level |
| `LOG_REQUESTS` | No | `true` | Log HTTP requests |

\* At least one AI provider key is required
\*\* Either `API_AUTH_TOKEN` or `API_AUTH_TOKENS` is required

## Development

### Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── config.ts           # Environment configuration
│   ├── middleware/
│   │   ├── auth.ts             # Authentication
│   │   ├── errorHandler.ts    # Error handling
│   │   └── rateLimiter.ts     # Rate limiting
│   ├── routes/
│   │   ├── ai.routes.ts        # AI endpoints
│   │   └── keywords.routes.ts  # Keyword endpoints
│   ├── services/
│   │   ├── aiService.ts        # AI copy generation
│   │   └── keywordService.ts   # Keyword research
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── index.ts                # Server entry point
├── .env.example                # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

```bash
# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Run production build
npm start
```

### Adding New Endpoints

1. Define types in `src/types/index.ts`
2. Create service function in `src/services/`
3. Add route handler in `src/routes/`
4. Import route in `src/index.ts`

Example:
```typescript
// src/routes/myFeature.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/my-endpoint', asyncHandler(async (req, res) => {
  // Your logic here
  res.json({ success: true, data: { ... } });
}));

export default router;
```

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

This creates the `dist/` directory with compiled JavaScript.

### 2. Set Environment Variables

Create `.env` file with production values:

```env
NODE_ENV=production
PORT=8000
ALLOWED_ORIGINS=https://your-frontend-domain.com
OPENAI_API_KEY=sk-prod-...
API_AUTH_TOKEN=<secure-production-token>
LOG_REQUESTS=false
```

### 3. Start the Server

```bash
npm start
```

### 4. Use a Process Manager

For production, use PM2:

```bash
npm install -g pm2

pm2 start dist/index.js --name campaign-builder-api
pm2 save
pm2 startup
```

### 5. Configure Reverse Proxy

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Security Best Practices

1. **API Keys**: Never commit `.env` file or expose API keys
2. **Authentication**: Use strong, randomly generated tokens
3. **CORS**: Configure specific allowed origins (not `*`)
4. **Rate Limiting**: Adjust based on your usage patterns
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Use secrets management in production
7. **Logging**: Don't log sensitive data (API keys, tokens)
8. **Updates**: Keep dependencies updated (`npm audit`)

## Troubleshooting

### Server won't start

Check configuration validation errors:
```bash
npm run dev
```

Look for error messages like:
- "API_AUTH_TOKEN must be configured"
- "At least one AI provider API key must be configured"

### Authentication fails

1. Verify token in `.env` matches frontend configuration
2. Check Authorization header format: `Bearer <token>`
3. Ensure no extra spaces in token

### AI requests fail

1. Verify API keys are valid and have credits
2. Check API key format (OpenAI: `sk-...`, Claude: `sk-ant-...`)
3. Review rate limits on AI provider dashboard
4. Check timeout settings in `.env`

### CORS errors

1. Add frontend URL to `ALLOWED_ORIGINS` in `.env`
2. Restart server after `.env` changes
3. Check browser console for specific CORS error

### Rate limit issues

Adjust in `.env`:
```env
RATE_LIMIT_WINDOW_MS=1800000  # 30 minutes
RATE_LIMIT_MAX_REQUESTS=200   # 200 requests
```

## Frontend Integration

Update frontend to use the backend API:

### 1. Frontend Environment Variables

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_API_TOKEN=<your-auth-token>
```

### 2. Frontend API Client

```typescript
// src/config/api.ts
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  authToken: import.meta.env.VITE_API_TOKEN || '',
};

// src/services/aiService.ts
export async function generateAdCopy(request: GenerateAdCopyRequest) {
  const response = await fetch(`${API_CONFIG.baseUrl}/api/ai/generate-copy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.authToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

## License

Proprietary - Google Ads Campaign Builder

## Support

For issues or questions, please contact the development team.
