/**
 * AI Service Usage Examples and Test Cases
 *
 * This file demonstrates how to use the AI service for ad copy generation.
 * It includes examples for different use cases and integration patterns.
 */

import {
  generateAdCopy,
  generateHeadlines,
  generateDescriptions,
  regenerateHeadlines,
  regenerateDescriptions,
  validateHeadline,
  validateDescription,
  isAIServiceAvailable,
  getAvailableProviders,
  formatAIError,
  type GenerateAdCopyRequest,
  AIServiceError,
} from './aiService';

/* ==================== EXAMPLE 1: Basic Usage ==================== */

/**
 * Example: Generate complete ad copy with minimal configuration
 */
async function example1_BasicUsage() {
  try {
    const result = await generateAdCopy({
      provider: 'openai',
      businessDescription: 'Premium organic dog food delivery service',
    });

    console.log('Generated Headlines:', result.headlines);
    console.log('Generated Descriptions:', result.descriptions);
    console.log('Generated at:', result.generatedAt);
  } catch (error) {
    console.error('Error:', formatAIError(error));
  }
}

/* ==================== EXAMPLE 2: Advanced Configuration ==================== */

/**
 * Example: Generate ad copy with full configuration
 */
async function example2_FullConfiguration() {
  const request: GenerateAdCopyRequest = {
    provider: 'openai',
    businessDescription: 'Premium organic dog food delivery service',
    targetKeywords: ['organic dog food', 'healthy dog food', 'dog food delivery'],
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
  };

  try {
    const result = await generateAdCopy(request);

    console.log('\n=== Generated Ad Copy ===\n');
    console.log('Headlines:');
    result.headlines.forEach((h, i) => {
      console.log(`${i + 1}. "${h}" (${h.length} chars)`);
    });

    console.log('\nDescriptions:');
    result.descriptions.forEach((d, i) => {
      console.log(`${i + 1}. "${d}" (${d.length} chars)`);
    });
  } catch (error) {
    if (error instanceof AIServiceError) {
      console.error(`AI Error [${error.code}]:`, error.message);
      console.error('Details:', error.details);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/* ==================== EXAMPLE 3: Headlines Only ==================== */

/**
 * Example: Generate only headlines
 */
async function example3_HeadlinesOnly() {
  try {
    const headlines = await generateHeadlines({
      provider: 'openai',
      businessDescription: 'Fast and affordable web hosting',
      targetKeywords: ['web hosting', 'cheap hosting', 'fast hosting'],
      tone: 'professional',
      headlineCount: 20,
    });

    console.log('Generated', headlines.length, 'headlines:');
    headlines.forEach((h, i) => console.log(`${i + 1}. ${h}`));
  } catch (error) {
    console.error('Error:', formatAIError(error));
  }
}

/* ==================== EXAMPLE 4: Descriptions Only ==================== */

/**
 * Example: Generate only descriptions
 */
async function example4_DescriptionsOnly() {
  try {
    const descriptions = await generateDescriptions({
      provider: 'openai',
      businessDescription: 'Professional resume writing service',
      callToAction: 'Get Started Today',
      uniqueSellingPoints: [
        'Expert writers',
        '24-hour turnaround',
        'Money-back guarantee',
      ],
      descriptionCount: 6,
    });

    console.log('Generated', descriptions.length, 'descriptions:');
    descriptions.forEach((d, i) => console.log(`${i + 1}. ${d}`));
  } catch (error) {
    console.error('Error:', formatAIError(error));
  }
}

/* ==================== EXAMPLE 5: Regenerate More Variations ==================== */

/**
 * Example: Generate initial copy, then regenerate more variations
 */
async function example5_RegenerateVariations() {
  const request: GenerateAdCopyRequest = {
    provider: 'openai',
    businessDescription: 'Online yoga classes for beginners',
    tone: 'friendly',
    callToAction: 'Start Free Trial',
  };

  try {
    // Initial generation
    const initial = await generateAdCopy(request);
    console.log('Initial headlines:', initial.headlines.length);

    // Generate more headline variations
    const moreHeadlines = await regenerateHeadlines(request, 10);
    console.log('Additional headlines:', moreHeadlines.length);

    // Generate more description variations
    const moreDescriptions = await regenerateDescriptions(request, 3);
    console.log('Additional descriptions:', moreDescriptions.length);

    // Combine all variations
    const allHeadlines = [...initial.headlines, ...moreHeadlines];
    const allDescriptions = [...initial.descriptions, ...moreDescriptions];

    console.log('\nTotal headlines:', allHeadlines.length);
    console.log('Total descriptions:', allDescriptions.length);
  } catch (error) {
    console.error('Error:', formatAIError(error));
  }
}

/* ==================== EXAMPLE 6: Provider Detection ==================== */

/**
 * Example: Check available providers and use the first available
 */
async function example6_ProviderDetection() {
  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    console.error('No AI providers are configured. Please add API keys.');
    return;
  }

  // Get available providers
  const providers = getAvailableProviders();
  console.log('Available providers:', providers);

  // Use the first available provider
  const provider = providers[0];
  console.log('Using provider:', provider);

  try {
    const result = await generateAdCopy({
      provider,
      businessDescription: 'Eco-friendly cleaning products',
      headlineCount: 10,
      descriptionCount: 3,
    });

    console.log('Generated with', provider);
    console.log('Headlines:', result.headlines.length);
    console.log('Descriptions:', result.descriptions.length);
  } catch (error) {
    console.error('Error:', formatAIError(error));
  }
}

/* ==================== EXAMPLE 7: Different Tones ==================== */

/**
 * Example: Generate ad copy with different tones
 */
async function example7_DifferentTones() {
  const baseRequest = {
    provider: 'openai' as const,
    businessDescription: 'Emergency plumbing service',
    headlineCount: 5,
    descriptionCount: 2,
  };

  const tones: Array<'professional' | 'casual' | 'urgent' | 'friendly'> = [
    'professional',
    'casual',
    'urgent',
    'friendly',
  ];

  for (const tone of tones) {
    try {
      console.log(`\n=== ${tone.toUpperCase()} TONE ===`);
      const result = await generateAdCopy({ ...baseRequest, tone });

      console.log('Headlines:');
      result.headlines.forEach((h) => console.log(`  - ${h}`));

      console.log('Descriptions:');
      result.descriptions.forEach((d) => console.log(`  - ${d}`));
    } catch (error) {
      console.error(`Error with ${tone} tone:`, formatAIError(error));
    }
  }
}

/* ==================== EXAMPLE 8: Validation ==================== */

/**
 * Example: Validate custom headlines and descriptions
 */
function example8_Validation() {
  const testHeadlines = [
    'Buy Now - Best Deal Ever!', // Valid
    'This headline is way too long for Google Ads requirements', // Too long
    'Great Products <script>', // Prohibited characters
    'Amazing!!! Incredible!!!', // Too many exclamation marks
  ];

  const testDescriptions = [
    'Get 50% off today. Free shipping on all orders. Shop now!', // Valid
    'This description is way too long and exceeds the maximum character limit allowed by Google Ads', // Too long
    'Great products {with} special [characters]', // Prohibited characters
  ];

  console.log('=== Headline Validation ===');
  testHeadlines.forEach((h) => {
    const isValid = validateHeadline(h);
    console.log(`${isValid ? '✓' : '✗'} "${h}" (${h.length} chars)`);
  });

  console.log('\n=== Description Validation ===');
  testDescriptions.forEach((d) => {
    const isValid = validateDescription(d);
    console.log(`${isValid ? '✓' : '✗'} "${d}" (${d.length} chars)`);
  });
}

/* ==================== EXAMPLE 9: Error Handling ==================== */

/**
 * Example: Proper error handling
 */
async function example9_ErrorHandling() {
  try {
    // Try to use a provider that's not configured
    await generateAdCopy({
      provider: 'openai',
      businessDescription: 'Test business',
    });
  } catch (error) {
    if (error instanceof AIServiceError) {
      switch (error.code) {
        case 'PROVIDER_NOT_CONFIGURED':
          console.error('Please configure your API key in .env.local');
          break;

        case 'AUTH_ERROR':
          console.error('Invalid API key. Please check your configuration.');
          break;

        case 'RATE_LIMIT':
          console.error('Rate limit exceeded. Please wait before retrying.');
          // Implement retry logic with exponential backoff
          break;

        case 'API_ERROR':
          console.error('API service error. Please try again later.');
          break;

        case 'INVALID_RESPONSE':
          console.error('Failed to generate valid copy. Please try again.');
          break;

        default:
          console.error('Unexpected error:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}

/* ==================== EXAMPLE 10: React Component Integration ==================== */

/**
 * Example: How to integrate with React components
 */
function example10_ReactIntegration() {
  // Example React hook usage (pseudo-code)
  /*
  function useAdCopyGenerator() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adCopy, setAdCopy] = useState<GeneratedAdCopy | null>(null);

    const generate = async (request: GenerateAdCopyRequest) => {
      setLoading(true);
      setError(null);

      try {
        const result = await generateAdCopy(request);
        setAdCopy(result);
      } catch (err) {
        setError(formatAIError(err));
      } finally {
        setLoading(false);
      }
    };

    return { generate, loading, error, adCopy };
  }

  // In your component:
  function AdCopyGenerator() {
    const { generate, loading, error, adCopy } = useAdCopyGenerator();

    const handleGenerate = () => {
      generate({
        provider: 'openai',
        businessDescription: formData.business,
        targetKeywords: formData.keywords,
        tone: formData.tone,
      });
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (adCopy) return <AdCopyResults data={adCopy} />;

    return <GenerateButton onClick={handleGenerate} />;
  }
  */

  console.log('See comments above for React integration example');
}

/* ==================== EXAMPLE 11: Zustand Store Integration ==================== */

/**
 * Example: How to integrate with Zustand store
 */
function example11_ZustandIntegration() {
  // Example Zustand store (pseudo-code)
  /*
  interface AdCopyStore {
    isGenerating: boolean;
    generatedCopy: GeneratedAdCopy | null;
    error: string | null;
    generateCopy: (request: GenerateAdCopyRequest) => Promise<void>;
    clearError: () => void;
  }

  const useAdCopyStore = create<AdCopyStore>((set) => ({
    isGenerating: false,
    generatedCopy: null,
    error: null,

    generateCopy: async (request) => {
      set({ isGenerating: true, error: null });

      try {
        const result = await generateAdCopy(request);
        set({ generatedCopy: result, isGenerating: false });
      } catch (error) {
        set({ error: formatAIError(error), isGenerating: false });
      }
    },

    clearError: () => set({ error: null }),
  }));

  // In your component:
  function MyComponent() {
    const { generateCopy, isGenerating, generatedCopy, error } = useAdCopyStore();

    const handleClick = () => {
      generateCopy({
        provider: 'openai',
        businessDescription: 'My business',
      });
    };

    return (
      <div>
        <button onClick={handleClick} disabled={isGenerating}>
          Generate Ad Copy
        </button>
        {error && <ErrorAlert message={error} />}
        {generatedCopy && <AdCopyDisplay data={generatedCopy} />}
      </div>
    );
  }
  */

  console.log('See comments above for Zustand integration example');
}

/* ==================== RUN EXAMPLES ==================== */

/**
 * Run all examples (uncomment to test)
 */
export async function runAllExamples() {
  console.log('=== AI Service Examples ===\n');

  // Validation example (doesn't require API)
  console.log('Example 8: Validation');
  example8_Validation();

  // Check if AI service is available before running API examples
  if (!isAIServiceAvailable()) {
    console.log('\nAI providers not configured. Skipping API examples.');
    console.log('To run API examples, add your API key to .env.local');
    return;
  }

  // Run API examples (uncomment as needed)
  // await example1_BasicUsage();
  // await example2_FullConfiguration();
  // await example3_HeadlinesOnly();
  // await example4_DescriptionsOnly();
  // await example5_RegenerateVariations();
  // await example6_ProviderDetection();
  // await example7_DifferentTones();
  // await example9_ErrorHandling();

  console.log('\nIntegration examples:');
  example10_ReactIntegration();
  example11_ZustandIntegration();
}

// Export all example functions
export {
  example1_BasicUsage,
  example2_FullConfiguration,
  example3_HeadlinesOnly,
  example4_DescriptionsOnly,
  example5_RegenerateVariations,
  example6_ProviderDetection,
  example7_DifferentTones,
  example8_Validation,
  example9_ErrorHandling,
  example10_ReactIntegration,
  example11_ZustandIntegration,
};
