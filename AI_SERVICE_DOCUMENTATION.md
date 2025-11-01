# AI Service Documentation

Complete documentation for the AI-powered ad copy generation service.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Core Services](#core-services)
- [React Integration](#react-integration)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The AI service provides intelligent ad copy generation for Google Ads campaigns using OpenAI GPT-4 or Anthropic Claude. It automatically:

- Generates headlines (max 30 characters)
- Generates descriptions (max 90 characters)
- Validates Google Ads compliance
- Handles API errors gracefully
- Supports multiple AI providers

### Features

- **Dual Provider Support**: OpenAI and Claude APIs
- **Google Ads Compliance**: Automatic character limit validation
- **Policy Enforcement**: Filters prohibited characters and excessive punctuation
- **Customizable Generation**: Control tone, keywords, CTAs, and more
- **React Integration**: Custom hooks for easy component integration
- **Error Handling**: Comprehensive error codes and user-friendly messages
- **Type Safety**: Full TypeScript support

---

## Installation

### 1. Install Dependencies

```bash
npm install openai @anthropic-ai/sdk
```

### 2. Configure API Keys

Create a `.env.local` file in the project root:

```bash
# OpenAI API Key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# Claude API Key (optional)
VITE_CLAUDE_API_KEY=sk-ant-your-claude-api-key-here
```

**Note**: You only need to configure one provider, but both are supported.

### 3. Get API Keys

**OpenAI**:
- Visit: https://platform.openai.com/api-keys
- Create an account or sign in
- Generate a new API key

**Claude** (optional):
- Visit: https://console.anthropic.com/
- Create an account or sign in
- Generate an API key

---

## Configuration

### AI Config File

Located at `src/config/aiConfig.ts`:

```typescript
export const AI_CONFIG = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    maxTokens: 500,
    temperature: 0.7,
  },
  claude: {
    apiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 500,
  },
  generation: {
    defaultHeadlineCount: 15,
    defaultDescriptionCount: 4,
    maxHeadlineLength: 30,
    maxDescriptionLength: 90,
  },
}
```

### Customization

You can modify these values to:
- Change the AI model
- Adjust token limits
- Set different default counts
- Modify temperature for creativity

---

## Core Services

### Main Service File

Located at `src/services/aiService.ts`

### Primary Functions

#### `generateAdCopy(request)`

Generate complete ad copy with headlines and descriptions.

```typescript
import { generateAdCopy } from '@/services/aiService';

const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food delivery',
  targetKeywords: ['organic dog food', 'healthy pets'],
  tone: 'professional',
  callToAction: 'Order Today',
  headlineCount: 15,
  descriptionCount: 4,
});

console.log(result.headlines);     // Array of 15 headlines
console.log(result.descriptions);  // Array of 4 descriptions
```

#### `generateHeadlines(request)`

Generate only headlines.

```typescript
const headlines = await generateHeadlines({
  provider: 'openai',
  businessDescription: 'Fast web hosting',
  headlineCount: 20,
});
```

#### `generateDescriptions(request)`

Generate only descriptions.

```typescript
const descriptions = await generateDescriptions({
  provider: 'openai',
  businessDescription: 'Resume writing service',
  descriptionCount: 6,
});
```

#### `regenerateHeadlines(request, count)`

Generate additional headline variations.

```typescript
const moreHeadlines = await regenerateHeadlines(request, 10);
```

#### `regenerateDescriptions(request, count)`

Generate additional description variations.

```typescript
const moreDescriptions = await regenerateDescriptions(request, 5);
```

---

## React Integration

### Using the Hook

The `useAIGeneration` hook provides a complete interface for React components.

#### Basic Usage

```tsx
import { useAIGeneration } from '@/hooks/useAIGeneration';

function AdCopyGenerator() {
  const {
    generate,
    isGenerating,
    generatedCopy,
    error,
    isAvailable,
    clearError,
  } = useAIGeneration();

  const handleGenerate = () => {
    generate({
      provider: 'openai',
      businessDescription: 'Premium dog food',
      targetKeywords: ['organic', 'healthy'],
      tone: 'professional',
    });
  };

  if (!isAvailable) {
    return (
      <div className="alert alert-warning">
        Please configure an AI provider in .env.local
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="btn btn-primary"
      >
        {isGenerating ? 'Generating...' : 'Generate Ad Copy'}
      </button>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}

      {generatedCopy && (
        <div className="results">
          <h3>Headlines ({generatedCopy.headlines.length})</h3>
          <ul>
            {generatedCopy.headlines.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          <h3>Descriptions ({generatedCopy.descriptions.length})</h3>
          <ul>
            {generatedCopy.descriptions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

#### Simplified Hook

For quick integration, use the simplified version:

```tsx
import { useAIGenerationSimple } from '@/hooks/useAIGeneration';

function QuickGenerator() {
  const { generate, loading, data, error } = useAIGenerationSimple();

  return (
    <button onClick={() => generate({
      provider: 'openai',
      businessDescription: 'My business'
    })}>
      {loading ? 'Loading...' : 'Generate'}
    </button>
  );
}
```

---

## API Reference

### Types

#### `GenerateAdCopyRequest`

```typescript
interface GenerateAdCopyRequest {
  provider: 'openai' | 'claude';
  businessDescription: string;
  targetKeywords?: string[];
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
  callToAction?: string;
  uniqueSellingPoints?: string[];
  targetAudience?: string;
  headlineCount?: number;
  descriptionCount?: number;
}
```

#### `GeneratedAdCopy`

```typescript
interface GeneratedAdCopy {
  headlines: string[];
  descriptions: string[];
  generatedAt: string;
  provider: 'openai' | 'claude';
}
```

#### `AIServiceError`

```typescript
class AIServiceError extends Error {
  code: AIErrorCode;
  message: string;
  details?: any;
}

type AIErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'INVALID_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';
```

### Utility Functions

#### `validateHeadline(headline: string): boolean`

Check if a headline complies with Google Ads policies.

```typescript
import { validateHeadline } from '@/services/aiService';

const isValid = validateHeadline('Premium Dog Food'); // true
const invalid = validateHeadline('This headline is way too long'); // false
```

#### `validateDescription(description: string): boolean`

Check if a description complies with Google Ads policies.

```typescript
import { validateDescription } from '@/services/aiService';

const isValid = validateDescription('Get 50% off today. Free shipping!'); // true
```

#### `isAIServiceAvailable(): boolean`

Check if any AI provider is configured.

```typescript
import { isAIServiceAvailable } from '@/services/aiService';

if (!isAIServiceAvailable()) {
  console.error('No AI providers configured');
}
```

#### `getAvailableProviders(): AIProvider[]`

Get list of configured providers.

```typescript
import { getAvailableProviders } from '@/services/aiService';

const providers = getAvailableProviders(); // ['openai'] or ['claude'] or both
```

#### `formatAIError(error: unknown): string`

Convert errors to user-friendly messages.

```typescript
import { formatAIError } from '@/services/aiService';

try {
  await generateAdCopy(request);
} catch (error) {
  const message = formatAIError(error);
  console.error(message); // "Authentication failed. Please check your API key."
}
```

---

## Error Handling

### Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `AUTH_ERROR` | Invalid API key | Check API key configuration |
| `RATE_LIMIT` | Too many requests | Wait before retrying |
| `API_ERROR` | Service unavailable | Try again later |
| `PROVIDER_NOT_CONFIGURED` | Missing API key | Add API key to .env.local |
| `INVALID_RESPONSE` | No valid copy generated | Try again with different input |
| `TIMEOUT` | Request took too long | Try again |
| `UNKNOWN_ERROR` | Unexpected error | Contact support |

### Error Handling Pattern

```typescript
import { AIServiceError, formatAIError } from '@/services/aiService';

try {
  const result = await generateAdCopy(request);
  // Success
} catch (error) {
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'PROVIDER_NOT_CONFIGURED':
        // Show configuration instructions
        break;
      case 'RATE_LIMIT':
        // Implement retry with delay
        break;
      case 'AUTH_ERROR':
        // Show API key error
        break;
      default:
        // Show generic error
        console.error(formatAIError(error));
    }
  }
}
```

---

## Best Practices

### 1. Provider Selection

```typescript
import { getAvailableProviders } from '@/services/aiService';

// Always check available providers first
const providers = getAvailableProviders();
const provider = providers[0] || 'openai';

await generateAdCopy({
  provider,
  businessDescription: '...',
});
```

### 2. Error Handling

Always wrap AI calls in try-catch blocks:

```typescript
try {
  const result = await generateAdCopy(request);
  // Handle success
} catch (error) {
  const message = formatAIError(error);
  // Show error to user
}
```

### 3. Loading States

Show loading indicators during generation:

```tsx
{isGenerating && <LoadingSpinner />}
```

### 4. Validation

Validate user input before generating:

```typescript
if (!businessDescription.trim()) {
  throw new Error('Business description is required');
}

if (headlineCount < 1 || headlineCount > 30) {
  throw new Error('Headline count must be between 1 and 30');
}
```

### 5. Result Validation

Always validate generated copy:

```typescript
const validHeadlines = result.headlines.filter(validateHeadline);
const validDescriptions = result.descriptions.filter(validateDescription);
```

### 6. Rate Limiting

Implement retry logic for rate limits:

```typescript
async function generateWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateAdCopy(request);
    } catch (error) {
      if (error instanceof AIServiceError && error.code === 'RATE_LIMIT') {
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
      }
      throw error;
    }
  }
}
```

---

## Examples

### Example 1: Full Configuration

```typescript
const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food delivery service',
  targetKeywords: [
    'organic dog food',
    'healthy dog food',
    'dog food delivery'
  ],
  tone: 'professional',
  callToAction: 'Order Today',
  uniqueSellingPoints: [
    'Free shipping on all orders',
    '100% organic ingredients',
    'Vet approved recipes'
  ],
  targetAudience: 'Dog owners who care about nutrition',
  headlineCount: 15,
  descriptionCount: 4,
});
```

### Example 2: Different Tones

```typescript
// Professional tone
const professional = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Legal services',
  tone: 'professional',
});

// Urgent tone
const urgent = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Emergency plumbing',
  tone: 'urgent',
});

// Friendly tone
const friendly = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Pet grooming',
  tone: 'friendly',
});
```

### Example 3: Regenerate More Variations

```typescript
// Initial generation
const initial = await generateAdCopy(request);

// Generate 10 more headlines
const moreHeadlines = await regenerateHeadlines(request, 10);

// Generate 3 more descriptions
const moreDescriptions = await regenerateDescriptions(request, 3);

// Combine all
const allHeadlines = [...initial.headlines, ...moreHeadlines];
const allDescriptions = [...initial.descriptions, ...moreDescriptions];
```

### Example 4: Provider Fallback

```typescript
async function generateWithFallback(request) {
  const providers = getAvailableProviders();

  for (const provider of providers) {
    try {
      return await generateAdCopy({ ...request, provider });
    } catch (error) {
      console.warn(`${provider} failed, trying next provider`);
    }
  }

  throw new Error('All providers failed');
}
```

---

## Security Notes

### API Key Security

**Current Implementation**: API keys are exposed in the client-side code (using `dangerouslyAllowBrowser: true`).

**For Production**: Implement a backend proxy to protect API keys:

```
Client → Your Backend → OpenAI/Claude
```

### Backend Proxy Example

```typescript
// backend/routes/ai.ts
app.post('/api/generate-ad-copy', async (req, res) => {
  const { businessDescription, tone } = req.body;

  const result = await generateAdCopy({
    provider: 'openai',
    businessDescription,
    tone,
  });

  res.json(result);
});
```

---

## Troubleshooting

### Issue: "Provider not configured"

**Solution**: Add API key to `.env.local` file.

### Issue: "Invalid API key"

**Solution**: Verify API key format:
- OpenAI keys start with `sk-`
- Claude keys start with `sk-ant-`

### Issue: "Rate limit exceeded"

**Solution**: Wait 60 seconds and retry. Consider implementing exponential backoff.

### Issue: "No valid headlines generated"

**Solution**: Try:
- More specific business description
- Different keywords
- Different tone
- Regenerate with same parameters

---

## Support

For issues or questions:
1. Check this documentation
2. Review example code in `src/services/aiService.demo.ts`
3. Check API provider documentation:
   - OpenAI: https://platform.openai.com/docs
   - Claude: https://docs.anthropic.com/

---

## File Structure

```
src/
├── config/
│   └── aiConfig.ts                 # AI service configuration
├── services/
│   ├── aiService.ts               # Core AI service
│   └── aiService.demo.ts          # Usage examples
└── hooks/
    └── useAIGeneration.ts         # React hook
```

---

## License

Internal use only for Google Ads Campaign Builder project.
