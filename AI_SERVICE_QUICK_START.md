# AI Service Quick Start Guide

Get started with AI-powered ad copy generation in 5 minutes.

---

## Step 1: Install Dependencies ✓

Dependencies are already installed:
- `openai` - OpenAI GPT-4 API client
- `@anthropic-ai/sdk` - Anthropic Claude API client

---

## Step 2: Configure API Key (Required)

### Option A: OpenAI (Recommended)

1. Get your API key from: https://platform.openai.com/api-keys
2. Create `.env.local` in project root:

```bash
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Option B: Claude (Alternative)

1. Get your API key from: https://console.anthropic.com/
2. Create `.env.local` in project root:

```bash
VITE_CLAUDE_API_KEY=sk-ant-your-claude-api-key-here
```

### Both Providers

You can configure both if you want:

```bash
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_CLAUDE_API_KEY=sk-ant-your-claude-api-key-here
```

---

## Step 3: Test the Service

### Run Validation Tests (No API Key Needed)

Create a test file or add to your component:

```typescript
import { runAllTests } from '@/services/aiService.test';

// Run all validation tests
runAllTests();
```

Expected output:
```
✓ All tests passed!
```

### Test API Connection (Requires API Key)

```typescript
import { generateAdCopy } from '@/services/aiService';

const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food',
  headlineCount: 5,
  descriptionCount: 2,
});

console.log('Headlines:', result.headlines);
console.log('Descriptions:', result.descriptions);
```

---

## Step 4: Integrate into React Component

### Basic Integration

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
      businessDescription: 'Premium organic dog food delivery',
      targetKeywords: ['organic', 'healthy', 'delivery'],
      tone: 'professional',
    });
  };

  if (!isAvailable) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p>Please configure an AI provider in .env.local</p>
        <p className="text-sm">Add VITE_OPENAI_API_KEY or VITE_CLAUDE_API_KEY</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Ad Copy'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
          <button onClick={clearError} className="text-sm text-red-600 underline">
            Dismiss
          </button>
        </div>
      )}

      {generatedCopy && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Headlines ({generatedCopy.headlines.length})
            </h3>
            <ul className="space-y-1">
              {generatedCopy.headlines.map((headline, index) => (
                <li key={index} className="p-2 bg-gray-50 rounded">
                  {headline} <span className="text-gray-400">({headline.length})</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Descriptions ({generatedCopy.descriptions.length})
            </h3>
            <ul className="space-y-1">
              {generatedCopy.descriptions.map((description, index) => (
                <li key={index} className="p-2 bg-gray-50 rounded">
                  {description} <span className="text-gray-400">({description.length})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Advanced Usage

### Generate with Full Configuration

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
    'Delivered fresh to your door',
  ],
  targetAudience: 'Dog owners who care about nutrition and convenience',
  headlineCount: 15,
  descriptionCount: 4,
});
```

### Regenerate More Variations

```typescript
const { regenerateMoreHeadlines } = useAIGeneration();

// Generate 10 more headlines
const moreHeadlines = await regenerateMoreHeadlines(request, 10);
```

### Different Tones

```typescript
// Professional tone
await generateAdCopy({ ...request, tone: 'professional' });

// Urgent tone
await generateAdCopy({ ...request, tone: 'urgent' });

// Friendly tone
await generateAdCopy({ ...request, tone: 'friendly' });

// Casual tone
await generateAdCopy({ ...request, tone: 'casual' });
```

---

## Common Use Cases

### Use Case 1: Campaign Builder Form

```tsx
function CampaignBuilderForm() {
  const [formData, setFormData] = useState({
    business: '',
    keywords: [],
    tone: 'professional',
  });

  const { generate, isGenerating, generatedCopy } = useAIGeneration();

  const handleSubmit = (e) => {
    e.preventDefault();
    generate({
      provider: 'openai',
      businessDescription: formData.business,
      targetKeywords: formData.keywords,
      tone: formData.tone,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isGenerating}>
        Generate Ad Copy
      </button>
    </form>
  );
}
```

### Use Case 2: Ad Group Creator

```tsx
function AdGroupCreator() {
  const { generate } = useAIGeneration();

  const handleCreateAdGroup = async (adGroupData) => {
    const result = await generate({
      provider: 'openai',
      businessDescription: adGroupData.description,
      targetKeywords: adGroupData.keywords,
    });

    // Add generated copy to ad group
    adGroupData.headlines = result.headlines;
    adGroupData.descriptions = result.descriptions;

    // Save ad group
    saveAdGroup(adGroupData);
  };
}
```

### Use Case 3: Bulk Generation

```tsx
async function generateForMultipleAdGroups(adGroups) {
  const results = [];

  for (const adGroup of adGroups) {
    const result = await generateAdCopy({
      provider: 'openai',
      businessDescription: adGroup.description,
      targetKeywords: adGroup.keywords,
    });

    results.push({
      adGroupId: adGroup.id,
      copy: result,
    });

    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
```

---

## Troubleshooting

### Issue: "Provider not configured"

**Solution**: Add API key to `.env.local`

```bash
VITE_OPENAI_API_KEY=sk-your-key-here
```

### Issue: "Invalid API key"

**Solution**: Verify key format:
- OpenAI keys start with `sk-`
- Claude keys start with `sk-ant-`

### Issue: "Rate limit exceeded"

**Solution**: Wait 60 seconds and retry. Consider implementing delay between requests.

```typescript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Issue: No headlines generated

**Solution**: Try with more specific business description or different keywords.

### Issue: TypeScript errors

**Solution**: Ensure you're using the correct import paths:

```typescript
import { generateAdCopy } from '@/services/aiService';
import { useAIGeneration } from '@/hooks/useAIGeneration';
```

---

## API Costs (Approximate)

### OpenAI GPT-4 Turbo
- Cost: ~$0.01-0.03 per generation
- Speed: 3-10 seconds
- Quality: Excellent

### Claude 3.5 Sonnet
- Cost: ~$0.015-0.05 per generation
- Speed: 3-8 seconds
- Quality: Excellent

**Note**: Actual costs depend on token usage. Monitor your usage in the provider dashboard.

---

## Next Steps

1. ✓ Install dependencies
2. ✓ Configure API key
3. ✓ Test the service
4. ✓ Integrate into component
5. ⏳ Build UI for ad copy generation
6. ⏳ Add to campaign builder workflow
7. ⏳ Implement saving/editing generated copy
8. ⏳ Add analytics tracking

---

## Resources

- **Full Documentation**: `AI_SERVICE_DOCUMENTATION.md`
- **Implementation Summary**: `AI_SERVICE_IMPLEMENTATION_SUMMARY.md`
- **Examples**: `src/services/aiService.demo.ts`
- **Tests**: `src/services/aiService.test.ts`

---

## Support

For detailed information, see the full documentation:
- API Reference
- Advanced examples
- Error handling
- Best practices
- Security considerations

---

## Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

---

You're all set! Start by adding your API key to `.env.local` and then import the hook into your components.
