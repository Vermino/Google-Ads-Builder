/**
 * React Hook for AI Ad Copy Generation
 *
 * Provides a convenient interface for generating ad copy in React components.
 * Handles loading states, error handling, and integration with the AI service.
 */

import { useState, useCallback } from 'react';
import {
  generateAdCopy,
  generateHeadlines,
  generateDescriptions,
  regenerateHeadlines,
  regenerateDescriptions,
  formatAIError,
  isAIServiceAvailable,
  getAvailableProviders,
  type GenerateAdCopyRequest,
  type GeneratedAdCopy,
  type AIProvider,
} from '@/services/aiService';

/**
 * Hook state interface
 */
interface UseAIGenerationState {
  /** Loading state */
  isGenerating: boolean;

  /** Generated ad copy */
  generatedCopy: GeneratedAdCopy | null;

  /** Error message (user-friendly) */
  error: string | null;

  /** Available AI providers */
  availableProviders: AIProvider[];

  /** Whether any AI service is configured */
  isAvailable: boolean;
}

/**
 * Hook actions interface
 */
interface UseAIGenerationActions {
  /** Generate complete ad copy (headlines + descriptions) */
  generate: (request: GenerateAdCopyRequest) => Promise<void>;

  /** Generate only headlines */
  generateHeadlinesOnly: (request: GenerateAdCopyRequest) => Promise<string[]>;

  /** Generate only descriptions */
  generateDescriptionsOnly: (request: GenerateAdCopyRequest) => Promise<string[]>;

  /** Generate more headline variations */
  regenerateMoreHeadlines: (
    request: GenerateAdCopyRequest,
    count?: number
  ) => Promise<string[]>;

  /** Generate more description variations */
  regenerateMoreDescriptions: (
    request: GenerateAdCopyRequest,
    count?: number
  ) => Promise<string[]>;

  /** Clear error message */
  clearError: () => void;

  /** Clear generated copy */
  clearGeneratedCopy: () => void;

  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook return type
 */
type UseAIGenerationReturn = UseAIGenerationState & UseAIGenerationActions;

/**
 * Custom React hook for AI ad copy generation
 *
 * @example
 * ```tsx
 * function AdCopyGenerator() {
 *   const {
 *     generate,
 *     isGenerating,
 *     generatedCopy,
 *     error,
 *     isAvailable,
 *     clearError,
 *   } = useAIGeneration();
 *
 *   const handleGenerate = () => {
 *     generate({
 *       provider: 'openai',
 *       businessDescription: 'Premium dog food',
 *       targetKeywords: ['organic', 'healthy'],
 *       tone: 'professional',
 *     });
 *   };
 *
 *   if (!isAvailable) {
 *     return <div>Please configure AI provider</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Generate Ad Copy'}
 *       </button>
 *
 *       {error && (
 *         <ErrorAlert message={error} onClose={clearError} />
 *       )}
 *
 *       {generatedCopy && (
 *         <AdCopyDisplay
 *           headlines={generatedCopy.headlines}
 *           descriptions={generatedCopy.descriptions}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAIGeneration(): UseAIGenerationReturn {
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedAdCopy | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check available providers (static values)
  const isAvailable = isAIServiceAvailable();
  const availableProviders = getAvailableProviders();

  /**
   * Generate complete ad copy
   */
  const generate = useCallback(async (request: GenerateAdCopyRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAdCopy(request);
      setGeneratedCopy(result);
    } catch (err) {
      const errorMessage = formatAIError(err);
      setError(errorMessage);
      setGeneratedCopy(null);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate only headlines
   */
  const generateHeadlinesOnly = useCallback(
    async (request: GenerateAdCopyRequest): Promise<string[]> => {
      setIsGenerating(true);
      setError(null);

      try {
        const headlines = await generateHeadlines(request);
        return headlines;
      } catch (err) {
        const errorMessage = formatAIError(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Generate only descriptions
   */
  const generateDescriptionsOnly = useCallback(
    async (request: GenerateAdCopyRequest): Promise<string[]> => {
      setIsGenerating(true);
      setError(null);

      try {
        const descriptions = await generateDescriptions(request);
        return descriptions;
      } catch (err) {
        const errorMessage = formatAIError(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Generate more headline variations
   */
  const regenerateMoreHeadlines = useCallback(
    async (request: GenerateAdCopyRequest, count: number = 5): Promise<string[]> => {
      setIsGenerating(true);
      setError(null);

      try {
        const headlines = await regenerateHeadlines(request, count);

        // If we have existing generated copy, append the new headlines
        if (generatedCopy) {
          setGeneratedCopy({
            ...generatedCopy,
            headlines: [...generatedCopy.headlines, ...headlines],
          });
        }

        return headlines;
      } catch (err) {
        const errorMessage = formatAIError(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatedCopy]
  );

  /**
   * Generate more description variations
   */
  const regenerateMoreDescriptions = useCallback(
    async (request: GenerateAdCopyRequest, count: number = 2): Promise<string[]> => {
      setIsGenerating(true);
      setError(null);

      try {
        const descriptions = await regenerateDescriptions(request, count);

        // If we have existing generated copy, append the new descriptions
        if (generatedCopy) {
          setGeneratedCopy({
            ...generatedCopy,
            descriptions: [...generatedCopy.descriptions, ...descriptions],
          });
        }

        return descriptions;
      } catch (err) {
        const errorMessage = formatAIError(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatedCopy]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear generated copy
   */
  const clearGeneratedCopy = useCallback(() => {
    setGeneratedCopy(null);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setGeneratedCopy(null);
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    generatedCopy,
    error,
    availableProviders,
    isAvailable,

    // Actions
    generate,
    generateHeadlinesOnly,
    generateDescriptionsOnly,
    regenerateMoreHeadlines,
    regenerateMoreDescriptions,
    clearError,
    clearGeneratedCopy,
    reset,
  };
}

/**
 * Simplified hook for quick integration
 * Returns only the essential state and actions
 *
 * @example
 * ```tsx
 * function QuickGenerator() {
 *   const { generate, loading, error, data } = useAIGenerationSimple();
 *
 *   return (
 *     <button onClick={() => generate({
 *       provider: 'openai',
 *       businessDescription: 'My business'
 *     })}>
 *       {loading ? 'Loading...' : 'Generate'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAIGenerationSimple() {
  const {
    generate,
    isGenerating,
    generatedCopy,
    error,
    clearError,
  } = useAIGeneration();

  return {
    generate,
    loading: isGenerating,
    data: generatedCopy,
    error,
    clearError,
  };
}

export default useAIGeneration;
