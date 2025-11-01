# AI Service for Google Ads Campaign Builder

A production-ready AI-powered ad copy generation service with dual provider support (OpenAI GPT-4 and Anthropic Claude).

---

## 🎯 Overview

This service automatically generates Google Ads compliant headlines and descriptions using advanced AI models. It ensures all generated copy meets Google's strict requirements including character limits, content policies, and formatting rules.

### Key Features

- ✅ **Dual Provider Support**: OpenAI GPT-4 Turbo & Anthropic Claude 3.5 Sonnet
- ✅ **Google Ads Compliance**: Automatic validation of character limits and policies
- ✅ **Smart Generation**: Context-aware copy based on business description, keywords, and tone
- ✅ **React Integration**: Custom hooks for seamless component integration
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- ✅ **Error Handling**: Robust error management with user-friendly messages
- ✅ **Validation**: Real-time validation of generated copy
- ✅ **Customizable**: Control tone, keywords, CTAs, and more

---

## 📁 File Structure

```
src/
├── config/
│   └── aiConfig.ts                     # Configuration & settings (121 lines)
├── services/
│   ├── aiService.ts                    # Core service implementation (697 lines)
│   ├── aiService.demo.ts              # 11 usage examples (486 lines)
│   └── aiService.test.ts              # Test suite (363 lines)
└── hooks/
    └── useAIGeneration.ts             # React hook (348 lines)

docs/
├── AI_SERVICE_DOCUMENTATION.md         # Complete API reference
├── AI_SERVICE_IMPLEMENTATION_SUMMARY.md # Implementation details
├── AI_SERVICE_QUICK_START.md          # 5-minute quick start
└── .env.local.example                 # Environment template
```

**Total Implementation**: 2,015 lines of TypeScript

---

## 🚀 Quick Start

### 1. Installation (Already Done)

```bash
npm install openai @anthropic-ai/sdk
```

### 2. Configuration

Create `.env.local`:

```bash
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get your API key: https://platform.openai.com/api-keys

### 3. Basic Usage

```typescript
import { generateAdCopy } from '@/services/aiService';

const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food',
});

console.log(result.headlines);      // Array of 15 headlines (max 30 chars each)
console.log(result.descriptions);   // Array of 4 descriptions (max 90 chars each)
```

### 4. React Integration

```tsx
import { useAIGeneration } from '@/hooks/useAIGeneration';

function MyComponent() {
  const { generate, isGenerating, generatedCopy, error } = useAIGeneration();

  return (
    <button onClick={() => generate({
      provider: 'openai',
      businessDescription: 'My business',
    })}>
      {isGenerating ? 'Generating...' : 'Generate Ad Copy'}
    </button>
  );
}
```

---

## 📖 Documentation

### Quick References

| Document | Purpose | Reading Time |
|----------|---------|--------------|
| [Quick Start Guide](AI_SERVICE_QUICK_START.md) | Get started in 5 minutes | 5 min |
| [Implementation Summary](AI_SERVICE_IMPLEMENTATION_SUMMARY.md) | Overview of what was built | 10 min |
| [Full Documentation](AI_SERVICE_DOCUMENTATION.md) | Complete API reference | 30 min |

### Code Examples

| File | Purpose | Examples |
|------|---------|----------|
| `src/services/aiService.demo.ts` | Usage examples | 11 examples |
| `src/services/aiService.test.ts` | Test cases | 24+ tests |

---

## 🔧 Core API

### Main Functions

#### `generateAdCopy(request)`

Generate complete ad copy with headlines and descriptions.

```typescript
interface GenerateAdCopyRequest {
  provider: 'openai' | 'claude';
  businessDescription: string;
  targetKeywords?: string[];
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
  callToAction?: string;
  uniqueSellingPoints?: string[];
  targetAudience?: string;
  headlineCount?: number;        // Default: 15
  descriptionCount?: number;     // Default: 4
}
```

#### `generateHeadlines(request)`

Generate only headlines (max 30 characters each).

#### `generateDescriptions(request)`

Generate only descriptions (max 90 characters each).

#### `regenerateHeadlines(request, count)`

Generate additional headline variations.

#### `regenerateDescriptions(request, count)`

Generate additional description variations.

### Validation Functions

#### `validateHeadline(headline: string): boolean`

Check if headline meets Google Ads requirements.

#### `validateDescription(description: string): boolean`

Check if description meets Google Ads requirements.

### Utility Functions

#### `isAIServiceAvailable(): boolean`

Check if any AI provider is configured.

#### `getAvailableProviders(): AIProvider[]`

Get list of configured providers.

#### `formatAIError(error: unknown): string`

Convert errors to user-friendly messages.

---

## 🎨 React Hook API

### `useAIGeneration()`

Complete hook with all features:

```typescript
const {
  // State
  isGenerating,              // boolean
  generatedCopy,            // GeneratedAdCopy | null
  error,                    // string | null
  availableProviders,       // AIProvider[]
  isAvailable,              // boolean

  // Actions
  generate,                 // (request) => Promise<void>
  generateHeadlinesOnly,    // (request) => Promise<string[]>
  generateDescriptionsOnly, // (request) => Promise<string[]>
  regenerateMoreHeadlines,  // (request, count?) => Promise<string[]>
  regenerateMoreDescriptions, // (request, count?) => Promise<string[]>
  clearError,              // () => void
  clearGeneratedCopy,      // () => void
  reset,                   // () => void
} = useAIGeneration();
```

### `useAIGenerationSimple()`

Simplified hook for quick integration:

```typescript
const {
  generate,    // (request) => Promise<void>
  loading,     // boolean
  data,        // GeneratedAdCopy | null
  error,       // string | null
  clearError,  // () => void
} = useAIGenerationSimple();
```

---

## 📋 Examples

### Example 1: Basic Generation

```typescript
const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Fast and reliable web hosting',
});
```

### Example 2: Full Configuration

```typescript
const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food delivery service',
  targetKeywords: ['organic dog food', 'healthy pets', 'dog food delivery'],
  tone: 'professional',
  callToAction: 'Order Today',
  uniqueSellingPoints: [
    'Free shipping on all orders',
    '100% organic ingredients',
    'Vet approved recipes',
  ],
  targetAudience: 'Dog owners who care about nutrition',
  headlineCount: 15,
  descriptionCount: 4,
});
```

### Example 3: Different Tones

```typescript
// Professional
const professional = await generateAdCopy({ tone: 'professional', ... });

// Urgent
const urgent = await generateAdCopy({ tone: 'urgent', ... });

// Friendly
const friendly = await generateAdCopy({ tone: 'friendly', ... });

// Casual
const casual = await generateAdCopy({ tone: 'casual', ... });
```

### Example 4: Regenerate More Variations

```typescript
// Initial generation
const initial = await generateAdCopy(request);

// Generate 10 more headlines
const moreHeadlines = await regenerateHeadlines(request, 10);

// Generate 3 more descriptions
const moreDescriptions = await regenerateDescriptions(request, 3);
```

### Example 5: React Component

```tsx
import { useAIGeneration } from '@/hooks/useAIGeneration';

function AdCopyGenerator() {
  const { generate, isGenerating, generatedCopy, error, clearError } = useAIGeneration();

  const handleGenerate = () => {
    generate({
      provider: 'openai',
      businessDescription: 'Premium dog food delivery',
      targetKeywords: ['organic', 'healthy'],
      tone: 'professional',
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Ad Copy'}
      </button>

      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}

      {generatedCopy && (
        <div>
          <h3>Headlines ({generatedCopy.headlines.length})</h3>
          {generatedCopy.headlines.map((h, i) => (
            <div key={i}>{h}</div>
          ))}

          <h3>Descriptions ({generatedCopy.descriptions.length})</h3>
          {generatedCopy.descriptions.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Validation Rules

### Headlines (Max 30 Characters)

**Allowed:**
- Up to 30 characters (including spaces)
- Standard punctuation: - & % $ @ #
- Up to 2 exclamation marks
- Up to 2 question marks

**Prohibited:**
- More than 30 characters
- Characters: < > { } [ ] \
- More than 2 exclamation/question marks
- Excessive capitalization (all caps)

### Descriptions (Max 90 Characters)

**Allowed:**
- Up to 90 characters (including spaces)
- Standard punctuation
- Up to 2 exclamation marks
- Up to 2 question marks

**Prohibited:**
- More than 90 characters
- Characters: < > { } [ ] \
- More than 2 exclamation/question marks

---

## 🔐 Error Handling

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_ERROR` | Invalid API key | Check `.env.local` configuration |
| `RATE_LIMIT` | Too many requests | Wait 60s and retry |
| `API_ERROR` | Service unavailable | Try again later |
| `PROVIDER_NOT_CONFIGURED` | No API key set | Add API key to `.env.local` |
| `INVALID_RESPONSE` | No valid copy | Retry with different input |
| `TIMEOUT` | Request timeout | Try again |
| `UNKNOWN_ERROR` | Unexpected error | Check logs |

### Error Handling Pattern

```typescript
import { AIServiceError, formatAIError } from '@/services/aiService';

try {
  const result = await generateAdCopy(request);
  // Success handling
} catch (error) {
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'PROVIDER_NOT_CONFIGURED':
        // Show configuration instructions
        break;
      case 'RATE_LIMIT':
        // Implement retry with delay
        break;
      default:
        // Show generic error
        console.error(formatAIError(error));
    }
  }
}
```

---

## 🧪 Testing

### Run Validation Tests

```typescript
import { runAllTests } from '@/services/aiService.test';

runAllTests(); // Runs all validation tests (no API key required)
```

### Test Coverage

- ✅ Headline validation (14 test cases)
- ✅ Description validation (10 test cases)
- ✅ Character counting (edge cases)
- ✅ Special characters (12 character types)
- ✅ Error formatting (10 error types)
- ✅ Provider detection

---

## 💰 API Costs

### OpenAI GPT-4 Turbo

- **Cost**: ~$0.01-0.03 per generation
- **Speed**: 3-10 seconds
- **Quality**: Excellent
- **Character Limit**: 30/90 chars enforced

### Claude 3.5 Sonnet

- **Cost**: ~$0.015-0.05 per generation
- **Speed**: 3-8 seconds
- **Quality**: Excellent
- **Character Limit**: 30/90 chars enforced

**Note**: Actual costs depend on token usage. Monitor usage in provider dashboard.

---

## 🔒 Security

### Current Implementation (Development)

- Client-side API calls
- API keys in `.env.local`
- Uses `dangerouslyAllowBrowser: true`

### Production Recommendations

1. **Backend Proxy**: Route all AI calls through backend
2. **API Key Protection**: Never expose keys to client
3. **Rate Limiting**: Implement server-side rate limiting
4. **Usage Monitoring**: Track API usage and costs

### Example Backend Proxy

```typescript
// backend/routes/ai.ts
app.post('/api/generate-ad-copy', async (req, res) => {
  const result = await generateAdCopy({
    provider: 'openai',
    ...req.body
  });
  res.json(result);
});
```

---

## 🎯 Use Cases

### 1. Campaign Builder Form

Generate ad copy based on user input in campaign creation form.

### 2. Ad Group Creator

Automatically generate headlines and descriptions when creating new ad groups.

### 3. Bulk Generation

Generate copy for multiple ad groups at once.

### 4. A/B Testing

Generate multiple variations for testing different messaging approaches.

### 5. Copy Refinement

Regenerate specific headlines or descriptions for refinement.

---

## 📊 Performance

- **Timeout**: 30 seconds per request
- **Retry**: 3 attempts (configurable)
- **Concurrent**: Generates headlines and descriptions in parallel
- **Rate Limiting**: Respects provider rate limits
- **Caching**: Not implemented (can be added)

---

## 🛠️ Configuration

### AI Models

Default models (configurable in `aiConfig.ts`):

- **OpenAI**: `gpt-4-turbo-preview`
- **Claude**: `claude-3-5-sonnet-20241022`

### Generation Defaults

- **Headlines**: 15 per generation
- **Descriptions**: 4 per generation
- **Max Headline Length**: 30 characters
- **Max Description Length**: 90 characters
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 500

---

## 🔧 Troubleshooting

### Issue: "Provider not configured"

**Solution**: Add API key to `.env.local`:

```bash
VITE_OPENAI_API_KEY=sk-your-key-here
```

### Issue: "Invalid API key"

**Solution**: Verify key format:
- OpenAI: starts with `sk-`
- Claude: starts with `sk-ant-`

### Issue: "Rate limit exceeded"

**Solution**: Wait 60 seconds. Add delay between requests:

```typescript
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Issue: No valid copy generated

**Solution**:
- Use more specific business description
- Try different keywords
- Change tone
- Regenerate with same parameters

---

## 📚 Additional Resources

- **OpenAI Documentation**: https://platform.openai.com/docs
- **Claude Documentation**: https://docs.anthropic.com/
- **Google Ads Policies**: https://support.google.com/adspolicy

---

## ✨ Features Highlights

### Smart Prompt Engineering

The service uses carefully crafted prompts that:
- Incorporate business context
- Include target keywords naturally
- Match desired tone
- Emphasize unique selling points
- Include clear calls-to-action
- Enforce Google Ads compliance

### Automatic Validation

All generated copy is automatically validated for:
- Character limits (30 for headlines, 90 for descriptions)
- Prohibited characters
- Excessive punctuation
- Policy compliance

### Type Safety

Full TypeScript support with:
- Request/response interfaces
- Error type definitions
- Provider type guards
- Comprehensive JSDoc comments

---

## 🚀 Next Steps

1. **Add API Key**: Configure `.env.local`
2. **Test Service**: Run validation tests
3. **Integrate UI**: Add to campaign builder
4. **Customize**: Adjust prompts and settings
5. **Deploy**: Implement backend proxy for production

---

## 📞 Support

For detailed information:
- Read the [Full Documentation](AI_SERVICE_DOCUMENTATION.md)
- Check [Quick Start Guide](AI_SERVICE_QUICK_START.md)
- Review [Examples](src/services/aiService.demo.ts)
- Run [Tests](src/services/aiService.test.ts)

---

## 📄 License

Internal use for Google Ads Campaign Builder project.

---

**Built with ❤️ for Google Ads Campaign Builder**

Version: 1.0.0
Last Updated: 2025-11-01
Total Implementation: 2,015 lines of TypeScript
