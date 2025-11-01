# AI Copy Generation Feature - Documentation

## Overview

The AI Copy Generation feature enables users to automatically generate compelling Google Ads headlines and descriptions using OpenAI GPT-4 or Claude 3.5 Sonnet. This feature integrates seamlessly into the Ad Builder workflow.

## Components

### 1. AIGenerateButton.tsx
**Location**: `src/components/ads/AIGenerateButton.tsx`

A styled button component that triggers AI generation.

**Props**:
- `onClick`: Function to call when button is clicked
- `isLoading`: Boolean to show loading state
- `disabled`: Boolean to disable the button
- `variant`: 'primary' | 'secondary' (default: 'primary')
- `className`: Optional additional CSS classes

**Features**:
- Gradient purple-blue styling
- Loading spinner animation
- Hover tooltip with feature description
- Sparkles icon from lucide-react

**Usage**:
```tsx
<AIGenerateButton
  onClick={() => setIsAIModalOpen(true)}
  isLoading={isGenerating}
/>
```

---

### 2. AIGenerationModal.tsx
**Location**: `src/components/modals/AIGenerationModal.tsx`

Main modal component for configuring and generating AI ad copy.

**Props**:
- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to call when modal closes
- `onUseGenerated`: Callback function with selected headlines and descriptions
- `initialBusinessDescription`: Pre-fill business description (optional)
- `initialKeywords`: Pre-fill keywords array (optional)

**Form Fields**:
- **AI Provider**: Radio buttons (OpenAI GPT-4 / Claude Sonnet)
- **Business Description**: Required textarea (min 10 chars)
- **Target Keywords**: Optional comma-separated input
- **Tone**: Dropdown (Professional, Casual, Urgent, Friendly)
- **Call to Action**: Optional text input
- **Advanced Options** (collapsible):
  - Unique Selling Points: Textarea (one per line)
  - Target Audience: Text input
  - Number of Headlines: Number input (3-15)
  - Number of Descriptions: Number input (2-4)

**States**:
- Form input state
- Loading state with progress message
- Error state with detailed error messages
- Success state showing results

**Validation**:
- Business description required (min 10 characters)
- Headline count: 3-15
- Description count: 2-4
- Provider must be configured

**Features**:
- Auto-focus on first input when opened
- Provider auto-selection based on available API keys
- Real-time validation with inline error messages
- Loading indicator with estimated time
- Keyboard support (Enter to submit, Escape to close)

---

### 3. AIGenerationResults.tsx
**Location**: `src/components/ads/AIGenerationResults.tsx`

Display component for generated ad copy with selection and action controls.

**Props**:
- `headlines`: Array of generated headline strings
- `descriptions`: Array of generated description strings
- `onUseSelected`: Callback with selected items
- `onRegenerate`: Function to regenerate copy
- `isRegenerating`: Boolean loading state for regeneration

**Features**:
- Checkbox selection for individual headlines/descriptions
- Character count display with color coding:
  - Green: 0-80% of limit
  - Yellow: 80-95% of limit
  - Red: 95-100% of limit
- "Select All" / "Deselect All" toggles
- "Copy Selected" to clipboard functionality
- "Regenerate" button to generate new variations
- "Use Selected" button to add to ad
- Scrollable lists with max height
- Selection count in action button

**Keyboard Support**:
- Checkbox navigation with Tab/Shift+Tab
- Space to toggle checkbox selection

---

### 4. AISettings.tsx
**Location**: `src/components/settings/AISettings.tsx`

Settings panel for managing AI provider API keys.

**Features**:
- **OpenAI API Key**:
  - Masked password input
  - Show/Hide toggle
  - Test connection button
  - Link to get API key
- **Claude API Key**:
  - Same features as OpenAI
- **Default Provider Selection**:
  - Radio buttons to choose default
  - Auto-switches if selected provider unavailable
- **Security Notice**:
  - Warning about localStorage usage
  - Production recommendations
- **API Key Validation**:
  - Format checking (sk- prefix for OpenAI, sk-ant- for Claude)
  - Test connection functionality
  - Success/error feedback

**Local Storage Keys**:
- `ai_openai_key`: OpenAI API key
- `ai_claude_key`: Claude API key
- `ai_default_provider`: Default provider ('openai' | 'claude')

---

### 5. Settings Page
**Location**: `src/pages/Settings.tsx`

Full settings page with AI configuration.

**Features**:
- Tab navigation (AI Configuration, General, Export)
- Back button navigation
- Responsive layout
- Breadcrumb context

**Route**: `/settings`

---

## Hooks

### useLocalStorage
**Location**: `src/hooks/useLocalStorage.ts`

Custom hook for persisting state in localStorage with cross-tab synchronization.

**API**:
```tsx
const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue);
```

**Features**:
- JSON serialization/deserialization
- Cross-tab synchronization via storage events
- Error handling with fallback to initial value
- Custom event dispatching for same-tab updates

**Usage**:
```tsx
const [apiKey, setApiKey] = useLocalStorage<string>('ai_openai_key', '');
```

---

### useAIGeneration
**Location**: `src/hooks/useAIGeneration.ts`

React hook for AI ad copy generation with state management.

**API**:
```tsx
const {
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
} = useAIGeneration();
```

**Methods**:
- `generate(request)`: Generate complete ad copy (headlines + descriptions)
- `generateHeadlinesOnly(request)`: Generate only headlines
- `generateDescriptionsOnly(request)`: Generate only descriptions
- `regenerateMoreHeadlines(request, count)`: Generate additional headlines
- `regenerateMoreDescriptions(request, count)`: Generate additional descriptions
- `clearError()`: Clear error message
- `clearGeneratedCopy()`: Clear generated results
- `reset()`: Reset to initial state

---

## Services

### AI Service
**Location**: `src/services/aiService.ts`

Core AI service for generating ad copy with both OpenAI and Claude providers.

**Main Functions**:

#### generateAdCopy(request)
Generate complete ad copy (headlines + descriptions).

```typescript
const result = await generateAdCopy({
  provider: 'openai',
  businessDescription: 'Premium organic dog food',
  targetKeywords: ['organic', 'healthy', 'premium'],
  tone: 'professional',
  callToAction: 'Order Today',
  uniqueSellingPoints: ['Free shipping', '100% organic', 'Vet approved'],
  targetAudience: 'Dog owners who care about nutrition',
  headlineCount: 15,
  descriptionCount: 4,
});

// Returns:
{
  headlines: ['Premium Organic Dog Food', ...],
  descriptions: ['Get vet-approved organic...', ...],
  generatedAt: '2024-01-01T00:00:00.000Z',
  provider: 'openai'
}
```

#### generateHeadlines(request)
Generate only headlines.

#### generateDescriptions(request)
Generate only descriptions.

#### regenerateHeadlines(request, count)
Generate additional headline variations.

#### regenerateDescriptions(request, count)
Generate additional description variations.

**Validation Functions**:
- `validateHeadline(text)`: Check headline compliance
- `validateDescription(text)`: Check description compliance
- `sanitizeAdCopy(text, maxLength)`: Clean and trim ad copy

**Utility Functions**:
- `isAIServiceAvailable()`: Check if any provider is configured
- `getAvailableProviders()`: Get list of configured providers
- `formatAIError(error)`: Convert error to user-friendly message

**Error Handling**:
Custom `AIServiceError` class with error codes:
- `AUTH_ERROR`: Invalid API key
- `RATE_LIMIT`: Rate limit exceeded
- `API_ERROR`: AI service error
- `PROVIDER_NOT_CONFIGURED`: No API key configured
- `INVALID_RESPONSE`: Failed to generate valid copy
- `TIMEOUT`: Request timeout
- `VALIDATION_ERROR`: Input validation failed
- `UNKNOWN_ERROR`: Unexpected error

---

## Configuration

### AI Config
**Location**: `src/config/aiConfig.ts`

**Dynamic API Key Resolution**:
```typescript
AI_CONFIG.openai.apiKey  // Gets from env or localStorage
AI_CONFIG.claude.apiKey  // Gets from env or localStorage
```

**Priority Order**:
1. Environment variable (`VITE_OPENAI_API_KEY`, `VITE_CLAUDE_API_KEY`)
2. localStorage (`ai_openai_key`, `ai_claude_key`)

**Configuration Options**:
- **OpenAI**:
  - Model: gpt-4-turbo-preview
  - Max Tokens: 500
  - Temperature: 0.7
- **Claude**:
  - Model: claude-3-5-sonnet-20241022
  - Max Tokens: 500
- **Generation Settings**:
  - Default headline count: 15
  - Default description count: 4
  - Max headline length: 30 characters
  - Max description length: 90 characters
  - Request timeout: 30 seconds
  - Retry attempts: 3

**Google Ads Policies**:
- Prohibited characters: `< > { } [ ] \`
- Max exclamation marks: 2
- Max question marks: 2
- Superlatives requiring proof tracked

---

## Integration with Ad Builder

### Updated AdBuilder.tsx
**Location**: `src/pages/AdBuilder.tsx`

**New Features**:
1. AI Generate button in header
2. AI Generation modal integration
3. Keyboard shortcut (Ctrl/Cmd + G)
4. Auto-add generated copy to ad

**Implementation**:
```tsx
const [isAIModalOpen, setIsAIModalOpen] = useState(false);

// Keyboard shortcut handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      setIsAIModalOpen(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// Handle AI generated copy
const handleUseGeneratedCopy = (headlines: string[], descriptions: string[]) => {
  // Add headlines (respecting MAX_COUNTS limit)
  headlines.forEach((text) => {
    if (ad.headlines.length < MAX_COUNTS.HEADLINES) {
      addHeadline(campaignId!, adGroupId!, adId!, {
        id: `h-${Date.now()}-${Math.random()}`,
        text,
      });
    }
  });

  // Add descriptions
  descriptions.forEach((text) => {
    addDescription(campaignId!, adGroupId!, adId!, {
      id: `d-${Date.now()}-${Math.random()}`,
      text,
    });
  });

  success(`Added ${headlines.length} headlines and ${descriptions.length} descriptions`);
};
```

---

## User Workflow

### 1. Initial Setup
1. Navigate to Settings (gear icon in Dashboard)
2. Enter OpenAI or Claude API key
3. Test connection
4. Save settings

### 2. Generate Ad Copy
1. Open an ad in Ad Builder
2. Click "Generate with AI" button (or press Ctrl/Cmd + G)
3. Fill in the generation form:
   - Select AI provider
   - Enter business description
   - Optionally add keywords, tone, CTA
   - Expand advanced options if needed
4. Click "Generate Ad Copy"
5. Wait 10-15 seconds for generation

### 3. Review and Select
1. Review generated headlines and descriptions
2. Check character counts
3. Select desired items using checkboxes
4. Use "Select All" or individual selection
5. Optionally "Copy Selected" to clipboard
6. Click "Regenerate" for new variations if needed

### 4. Use Generated Copy
1. Click "Use Selected"
2. Selected items automatically added to ad
3. Modal closes
4. Toast notification confirms addition
5. Edit or fine-tune the generated copy as needed

---

## Keyboard Shortcuts

- **Ctrl/Cmd + G**: Open AI generation modal (in Ad Builder)
- **Enter**: Submit generation form (when not in textarea)
- **Escape**: Close modal
- **Tab/Shift+Tab**: Navigate form fields and checkboxes
- **Space**: Toggle checkbox selection

---

## Error Handling

### User-Facing Error Messages

1. **No API Key Configured**:
   - Yellow warning in modal
   - Link to Settings page
   - Button disabled

2. **Invalid API Key**:
   - "Authentication failed. Please check your API key configuration."
   - Test connection shows error

3. **Rate Limit Exceeded**:
   - "Rate limit exceeded. Please try again in a few moments."
   - Suggestion to wait

4. **API Service Error**:
   - "AI service is temporarily unavailable. Please try again later."
   - Retry button available

5. **Invalid Response**:
   - "Failed to generate valid ad copy. Please try again."
   - May suggest adjusting inputs

6. **Validation Errors**:
   - Inline field-specific errors
   - Red border on invalid fields
   - Clear error messages

7. **Timeout**:
   - "Request timed out. Please try again."
   - Auto-retry option

---

## Accessibility Features

- **ARIA Labels**: All buttons and inputs have descriptive labels
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Auto-focus on first field when modal opens
- **Screen Reader Support**: Status announcements for generation progress
- **Color Contrast**: WCAG AA compliant color schemes
- **Error Announcements**: Screen reader announces errors
- **Tooltip Descriptions**: Clear explanations of features

---

## Responsive Design

- **Desktop**: Full modal with side-by-side layout for results
- **Tablet**: Stacked layout, full-width form fields
- **Mobile**:
  - Full-screen modal
  - Vertical stacking of all elements
  - Touch-friendly checkboxes and buttons
  - Scrollable results lists
  - Sticky action buttons

---

## Performance Optimizations

1. **Lazy Loading**: Settings page lazy loaded
2. **Memoization**: useCallback for event handlers
3. **Debouncing**: Form validation debounced
4. **Code Splitting**: Modal only loaded when needed
5. **Parallel Generation**: Headlines and descriptions generated concurrently
6. **Request Caching**: Duplicate requests prevented
7. **Timeout Handling**: 30-second timeout prevents hanging

---

## Security Considerations

### Current Implementation
- API keys stored in browser localStorage
- Keys accessible via JavaScript
- No server-side proxy

### Production Recommendations

1. **Backend Proxy**:
   ```
   Client → Your Server → OpenAI/Claude API
   ```
   - Store API keys server-side only
   - Add rate limiting
   - Add usage tracking
   - Add authentication

2. **Environment Variables**:
   - Use `.env.local` for development
   - Never commit API keys to version control
   - Use secure secret management in production

3. **API Key Security**:
   - Rotate keys regularly
   - Use separate keys for dev/prod
   - Monitor usage and set spending limits
   - Implement IP whitelisting if possible

4. **User Data Privacy**:
   - Consider what business data is sent to AI providers
   - Add terms of service acknowledgment
   - Comply with GDPR/privacy regulations

---

## Testing

### Manual Testing Checklist

- [ ] OpenAI API key configuration
- [ ] Claude API key configuration
- [ ] Default provider selection
- [ ] API key validation
- [ ] Test connection functionality
- [ ] Modal open/close
- [ ] Form validation (all fields)
- [ ] Generation with OpenAI
- [ ] Generation with Claude
- [ ] Headline selection
- [ ] Description selection
- [ ] Select All / Deselect All
- [ ] Copy to clipboard
- [ ] Regenerate functionality
- [ ] Use selected items
- [ ] Error handling (each error type)
- [ ] Keyboard shortcuts
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Accessibility (keyboard navigation)
- [ ] Character count display
- [ ] Loading states
- [ ] Toast notifications

---

## Future Enhancements

### Planned Features
1. **Batch Generation**: Generate copy for multiple ads at once
2. **Templates**: Save generation templates for reuse
3. **History**: View previously generated copy
4. **A/B Testing**: Generate multiple variations for testing
5. **Performance Tracking**: Track which AI-generated ads perform best
6. **Custom Prompts**: Allow users to customize AI prompts
7. **Multi-Language**: Generate copy in different languages
8. **Brand Voice**: Train on brand guidelines for consistent tone
9. **Competitor Analysis**: Analyze competitor ads for insights
10. **Budget Optimization**: AI suggestions for budget allocation

### Technical Improvements
1. Server-side API proxy
2. Redis caching for generated copy
3. Rate limiting per user
4. Usage analytics and reporting
5. Webhook for async generation
6. Streaming responses for real-time feedback
7. Fine-tuned models for ad copy
8. Integration with Google Ads API for performance data

---

## Troubleshooting

### Common Issues

**Issue**: "No API Key Configured" warning
- **Solution**: Go to Settings and enter your OpenAI or Claude API key

**Issue**: "Authentication failed" error
- **Solution**: Check that your API key is correct and starts with `sk-` (OpenAI) or `sk-ant-` (Claude)

**Issue**: Generation takes too long / times out
- **Solution**: Check your internet connection, try again, or try the other AI provider

**Issue**: Generated copy is over character limit
- **Solution**: This shouldn't happen due to validation, but if it does, manually trim the copy

**Issue**: Modal doesn't open when clicking button
- **Solution**: Check browser console for errors, ensure no API key is configured in Settings

**Issue**: "Use Selected" button disabled
- **Solution**: Select at least one headline or description

**Issue**: Keyboard shortcut (Ctrl+G) not working
- **Solution**: Ensure you're on the Ad Builder page and not in a text input field

---

## Support and Resources

### API Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude API Docs](https://docs.anthropic.com)

### Getting API Keys
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Claude API Keys](https://console.anthropic.com/account/keys)

### Google Ads Policies
- [Google Ads Editorial Policies](https://support.google.com/adspolicy)
- [Character Limits](https://support.google.com/google-ads/answer/1704389)

### Component Library
- [Lucide React Icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## File Structure

```
src/
├── components/
│   ├── ads/
│   │   ├── AIGenerateButton.tsx          # AI button component
│   │   └── AIGenerationResults.tsx       # Results display component
│   ├── modals/
│   │   └── AIGenerationModal.tsx         # Main generation modal
│   └── settings/
│       └── AISettings.tsx                # Settings panel
├── hooks/
│   ├── useAIGeneration.ts                # AI generation hook
│   └── useLocalStorage.ts                # localStorage hook
├── services/
│   └── aiService.ts                      # Core AI service
├── config/
│   └── aiConfig.ts                       # AI configuration
└── pages/
    ├── AdBuilder.tsx                     # Updated with AI integration
    └── Settings.tsx                      # Settings page
```

---

## Credits

**Built with**:
- React 19
- TypeScript
- OpenAI GPT-4 API
- Anthropic Claude API
- Tailwind CSS
- Lucide React Icons
- Zustand (state management)

**Created for**: Google Ads Campaign Builder
**Version**: 1.0.0
**Last Updated**: 2024
