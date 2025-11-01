import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import AIGenerationResults from '@/components/ads/AIGenerationResults';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { AIProvider, AdTone, GenerateAdCopyRequest } from '@/services/aiService';

export interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseGenerated: (headlines: string[], descriptions: string[]) => void;
  initialBusinessDescription?: string;
  initialKeywords?: string[];
}

const TONE_OPTIONS: { value: AdTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'friendly', label: 'Friendly' },
];

const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
  onUseGenerated,
  initialBusinessDescription = '',
  initialKeywords = [],
}) => {
  // Local storage for API keys
  const [openaiKey] = useLocalStorage<string>('ai_openai_key', '');
  const [claudeKey] = useLocalStorage<string>('ai_claude_key', '');

  // AI generation hook
  const {
    generate,
    isGenerating,
    generatedCopy,
    error,
    clearError,
    clearGeneratedCopy,
    reset,
  } = useAIGeneration();

  // Form state
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [businessDescription, setBusinessDescription] = useState(initialBusinessDescription);
  const [targetKeywords, setTargetKeywords] = useState(initialKeywords.join(', '));
  const [tone, setTone] = useState<AdTone>('professional');
  const [callToAction, setCallToAction] = useState('');
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [headlineCount, setHeadlineCount] = useState(15);
  const [descriptionCount, setDescriptionCount] = useState(4);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Refs for focus management
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBusinessDescription(initialBusinessDescription);
      setTargetKeywords(initialKeywords.join(', '));
      setValidationErrors({});
      clearError();

      // Set default provider based on available API keys
      if (openaiKey) {
        setProvider('openai');
      } else if (claudeKey) {
        setProvider('claude');
      }

      // Focus first input
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      // Clear generated copy when closing
      clearGeneratedCopy();
    }
  }, [isOpen, initialBusinessDescription, initialKeywords, openaiKey, claudeKey, clearError, clearGeneratedCopy]);

  // Check if any provider is configured
  const hasConfiguredProvider = openaiKey || claudeKey;
  const isProviderAvailable = (p: AIProvider) => {
    return p === 'openai' ? !!openaiKey : !!claudeKey;
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!businessDescription.trim()) {
      errors.businessDescription = 'Business description is required';
    } else if (businessDescription.trim().length < 10) {
      errors.businessDescription = 'Business description must be at least 10 characters';
    }

    if (headlineCount < 3 || headlineCount > 15) {
      errors.headlineCount = 'Headline count must be between 3 and 15';
    }

    if (descriptionCount < 2 || descriptionCount > 4) {
      errors.descriptionCount = 'Description count must be between 2 and 4';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleGenerate = async () => {
    // Clear previous errors
    clearError();
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Parse keywords
    const keywords = targetKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Parse USPs
    const usps = uniqueSellingPoints
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    // Build request
    const request: GenerateAdCopyRequest = {
      provider,
      businessDescription: businessDescription.trim(),
      targetKeywords: keywords.length > 0 ? keywords : undefined,
      tone,
      callToAction: callToAction.trim() || undefined,
      uniqueSellingPoints: usps.length > 0 ? usps : undefined,
      targetAudience: targetAudience.trim() || undefined,
      headlineCount,
      descriptionCount,
    };

    // Generate ad copy
    await generate(request);
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    await handleGenerate();
  };

  // Handle use selected
  const handleUseSelected = (headlines: string[], descriptions: string[]) => {
    onUseGenerated(headlines, descriptions);
    reset();
    onClose();
  };

  // Handle close
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Ad Copy with AI" size="xl">
      <div className="space-y-6">
        {/* No API Key Warning */}
        {!hasConfiguredProvider && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-yellow-800">
                  No API Key Configured
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Please configure your OpenAI or Claude API key in Settings to use AI generation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-semibold text-red-800">Generation Failed</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button onClick={clearError} className="text-red-600 hover:text-red-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Show results or form */}
        {generatedCopy ? (
          <AIGenerationResults
            headlines={generatedCopy.headlines}
            descriptions={generatedCopy.descriptions}
            onUseSelected={handleUseSelected}
            onRegenerate={handleRegenerate}
            isRegenerating={isGenerating}
          />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="space-y-5"
          >
            {/* AI Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <div className="flex space-x-4">
                <label
                  className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    provider === 'openai'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } ${!isProviderAvailable('openai') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="openai"
                    checked={provider === 'openai'}
                    onChange={(e) => setProvider(e.target.value as AIProvider)}
                    disabled={!isProviderAvailable('openai')}
                    className="sr-only"
                  />
                  <span className="font-medium">OpenAI GPT-4</span>
                  {!isProviderAvailable('openai') && (
                    <span className="ml-2 text-xs">(Not configured)</span>
                  )}
                </label>

                <label
                  className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    provider === 'claude'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } ${!isProviderAvailable('claude') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="claude"
                    checked={provider === 'claude'}
                    onChange={(e) => setProvider(e.target.value as AIProvider)}
                    disabled={!isProviderAvailable('claude')}
                    className="sr-only"
                  />
                  <span className="font-medium">Claude Sonnet</span>
                  {!isProviderAvailable('claude') && (
                    <span className="ml-2 text-xs">(Not configured)</span>
                  )}
                </label>
              </div>
            </div>

            {/* Business Description */}
            <div>
              <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={firstInputRef}
                id="businessDescription"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe your business, product, or service..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.businessDescription ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.businessDescription && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.businessDescription}</p>
              )}
            </div>

            {/* Target Keywords */}
            <div>
              <label htmlFor="targetKeywords" className="block text-sm font-medium text-gray-700 mb-1">
                Target Keywords <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                id="targetKeywords"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="organic, premium, fast delivery"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated keywords</p>
            </div>

            {/* Tone */}
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as AdTone)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Call to Action */}
            <div>
              <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 mb-1">
                Call to Action <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                id="callToAction"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="Shop Now, Learn More, Get Started"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Advanced Options</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
                  {/* Unique Selling Points */}
                  <div>
                    <label htmlFor="uniqueSellingPoints" className="block text-sm font-medium text-gray-700 mb-1">
                      Unique Selling Points
                    </label>
                    <textarea
                      id="uniqueSellingPoints"
                      value={uniqueSellingPoints}
                      onChange={(e) => setUniqueSellingPoints(e.target.value)}
                      placeholder="Enter each selling point on a new line"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      id="targetAudience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., Young professionals, Dog owners"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Count Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="headlineCount" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Headlines
                      </label>
                      <input
                        type="number"
                        id="headlineCount"
                        value={headlineCount}
                        onChange={(e) => setHeadlineCount(parseInt(e.target.value, 10))}
                        min={3}
                        max={15}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.headlineCount ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.headlineCount && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.headlineCount}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="descriptionCount" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Descriptions
                      </label>
                      <input
                        type="number"
                        id="descriptionCount"
                        value={descriptionCount}
                        onChange={(e) => setDescriptionCount(parseInt(e.target.value, 10))}
                        min={2}
                        max={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.descriptionCount ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.descriptionCount && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.descriptionCount}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loading State Info */}
            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Generating ad copy...</p>
                    <p className="text-xs text-blue-700 mt-1">This usually takes 10-15 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={handleClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!hasConfiguredProvider || isGenerating}
                className="inline-flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Ad Copy</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AIGenerationModal;
