# AI Copy Generation - Component Architecture

## Visual Component Tree

```
App.tsx
├── Router
│   ├── Dashboard.tsx (/dashboard)
│   │   ├── Header
│   │   │   └── Settings Button (gear icon) → /settings
│   │   ├── CampaignList
│   │   └── Modals
│   │       ├── NewCampaignModal
│   │       └── ExportModal
│   │
│   ├── Settings.tsx (/settings) ✨ NEW
│   │   ├── Header (with back button)
│   │   ├── Tab Navigation
│   │   │   ├── AI Configuration Tab (active)
│   │   │   ├── General Tab
│   │   │   └── Export Tab
│   │   └── AISettings Component ✨ NEW
│   │       ├── OpenAI Key Input
│   │       │   ├── Masked Input
│   │       │   ├── Show/Hide Toggle
│   │       │   └── Test Connection Button
│   │       ├── Claude Key Input
│   │       │   ├── Masked Input
│   │       │   ├── Show/Hide Toggle
│   │       │   └── Test Connection Button
│   │       ├── Default Provider Selection
│   │       └── Save Button
│   │
│   └── AdBuilder.tsx (/campaigns/:id/ad-groups/:id/ads/:id)
│       ├── Header
│       │   ├── Back Button
│       │   ├── Ad Name
│       │   ├── Save Button
│       │   └── AIGenerateButton ✨ NEW
│       │       ├── Sparkles Icon
│       │       ├── Hover Tooltip
│       │       └── onClick → opens AIGenerationModal
│       │
│       ├── Main Content
│       │   ├── URL Settings Section
│       │   ├── Headlines Section
│       │   │   └── HeadlineInput[] (existing)
│       │   ├── Descriptions Section
│       │   │   └── DescriptionInput[] (existing)
│       │   └── AdPreview (existing)
│       │
│       ├── Toast Notifications
│       │
│       └── AIGenerationModal ✨ NEW
│           ├── Modal Component (reused)
│           ├── Provider Selection
│           │   ├── OpenAI Radio Button
│           │   └── Claude Radio Button
│           ├── Form Fields
│           │   ├── Business Description (textarea)
│           │   ├── Target Keywords (input)
│           │   ├── Tone (select)
│           │   ├── Call to Action (input)
│           │   └── Advanced Options (collapsible)
│           │       ├── Unique Selling Points (textarea)
│           │       ├── Target Audience (input)
│           │       ├── Headline Count (number)
│           │       └── Description Count (number)
│           ├── Loading State
│           │   ├── Spinner
│           │   └── Progress Message
│           ├── Error State
│           │   └── Error Alert
│           └── AIGenerationResults ✨ NEW (shown after generation)
│               ├── Headlines Section
│               │   ├── Header with count
│               │   ├── Select All / Deselect All
│               │   ├── Copy Selected Button
│               │   └── Headline Checkboxes
│               │       ├── Checkbox
│               │       ├── Text
│               │       └── Character Count (colored)
│               ├── Descriptions Section
│               │   ├── Header with count
│               │   ├── Select All / Deselect All
│               │   ├── Copy Selected Button
│               │   └── Description Checkboxes
│               │       ├── Checkbox
│               │       ├── Text
│               │       └── Character Count (colored)
│               └── Action Buttons
│                   ├── Regenerate Button
│                   └── Use Selected Button
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. CONFIGURE API KEYS                        │
│                                                                 │
│  User → Settings Page → AISettings Component                   │
│         → Enter API Key → Test Connection                      │
│         → Save → useLocalStorage Hook                          │
│         → localStorage.setItem('ai_openai_key', key)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  2. TRIGGER AI GENERATION                       │
│                                                                 │
│  User → Ad Builder Page → Click "Generate with AI"             │
│         (or press Ctrl+G)                                       │
│         → setIsAIModalOpen(true)                               │
│         → AIGenerationModal opens                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. FILL GENERATION FORM                      │
│                                                                 │
│  User → Select Provider (OpenAI/Claude)                        │
│       → Enter Business Description                             │
│       → Add Keywords, Tone, CTA (optional)                     │
│       → Expand Advanced Options (optional)                     │
│       → Click "Generate Ad Copy"                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  4. AI GENERATION PROCESS                       │
│                                                                 │
│  AIGenerationModal → useAIGeneration Hook                      │
│                   → generate(request)                          │
│                   → aiService.generateAdCopy()                 │
│                   │                                            │
│                   ├─→ aiConfig.ts (get API key)               │
│                   │   ├─→ Check env variable                  │
│                   │   └─→ Check localStorage                  │
│                   │                                            │
│                   ├─→ generateHeadlines()                     │
│                   │   ├─→ buildHeadlinePrompt()               │
│                   │   ├─→ callOpenAI() or callClaude()       │
│                   │   ├─→ parseHeadlines()                    │
│                   │   └─→ validateHeadline() for each        │
│                   │                                            │
│                   └─→ generateDescriptions()                  │
│                       ├─→ buildDescriptionPrompt()            │
│                       ├─→ callOpenAI() or callClaude()       │
│                       ├─→ parseDescriptions()                 │
│                       └─→ validateDescription() for each     │
│                                                                │
│  Returns: GeneratedAdCopy                                     │
│    { headlines: string[], descriptions: string[] }            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. DISPLAY RESULTS                           │
│                                                                 │
│  AIGenerationModal → Shows AIGenerationResults                 │
│                   → User sees headlines & descriptions          │
│                   → Character counts displayed                 │
│                   → Checkboxes for selection                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    6. SELECT & USE COPY                         │
│                                                                 │
│  User → Checks desired headlines/descriptions                  │
│       → Click "Use Selected"                                   │
│       → AIGenerationResults.onUseSelected()                    │
│       → AdBuilder.handleUseGeneratedCopy()                     │
│       → useCampaignStore.addHeadline() (for each)             │
│       → useCampaignStore.addDescription() (for each)          │
│       → Toast notification shown                              │
│       → Modal closes                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    7. EDIT & FINALIZE                           │
│                                                                 │
│  User → Sees AI-generated copy in ad builder                  │
│       → Can edit/delete individual items                       │
│       → Can add more manually                                  │
│       → Can regenerate for more options                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL STORAGE STATE                         │
│  (Persisted across sessions, synced across tabs)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ useLocalStorage Hook
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Key                    Value                    Component       │
├─────────────────────────────────────────────────────────────────┤
│  ai_openai_key         "sk-..."                 AISettings      │
│  ai_claude_key         "sk-ant-..."             AISettings      │
│  ai_default_provider   "openai" | "claude"      AISettings      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Read by aiConfig.ts
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENT STATE                            │
│  (React component state, managed by hooks)                      │
└─────────────────────────────────────────────────────────────────┘

AIGenerationModal Component State:
├── provider: AIProvider
├── businessDescription: string
├── targetKeywords: string
├── tone: AdTone
├── callToAction: string
├── uniqueSellingPoints: string
├── targetAudience: string
├── headlineCount: number
├── descriptionCount: number
├── showAdvanced: boolean
└── validationErrors: Record<string, string>

useAIGeneration Hook State:
├── isGenerating: boolean
├── generatedCopy: GeneratedAdCopy | null
├── error: string | null
├── availableProviders: AIProvider[]
└── isAvailable: boolean

AIGenerationResults Component State:
├── selectedHeadlines: Set<string>
├── selectedDescriptions: Set<string>
└── copiedType: 'headlines' | 'descriptions' | null

AISettings Component State:
├── openaiKeyInput: string
├── claudeKeyInput: string
├── showOpenaiKey: boolean
├── showClaudeKey: boolean
├── testingOpenai: boolean
├── testingClaude: boolean
├── openaiTestResult: 'success' | 'error' | null
├── claudeTestResult: 'success' | 'error' | null
├── isSaving: boolean
└── saveSuccess: boolean

AdBuilder Component State (existing + new):
├── isAIModalOpen: boolean (NEW)
└── (existing ad builder state...)
```

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      KEYBOARD EVENTS                            │
└─────────────────────────────────────────────────────────────────┘

Ctrl/Cmd + G (in Ad Builder)
    │
    ├─→ e.preventDefault()
    └─→ setIsAIModalOpen(true)

Enter (in AIGenerationModal form)
    │
    ├─→ e.preventDefault()
    └─→ handleGenerate()

Escape (in AIGenerationModal)
    │
    └─→ onClose() (handled by Modal component)

Tab / Shift+Tab
    │
    └─→ Native browser focus navigation

Space (on checkbox)
    │
    └─→ Native checkbox toggle


┌─────────────────────────────────────────────────────────────────┐
│                       CLICK EVENTS                              │
└─────────────────────────────────────────────────────────────────┘

AIGenerateButton Click
    │
    └─→ onClick() → setIsAIModalOpen(true)

Provider Radio Click
    │
    └─→ setProvider('openai' | 'claude')

Generate Button Click
    │
    ├─→ validateForm()
    ├─→ generate(request)
    └─→ (wait for AI response)

Headline Checkbox Click
    │
    └─→ toggleHeadline(headline)

Select All Click
    │
    └─→ setSelectedHeadlines(new Set(headlines))

Copy Selected Click
    │
    ├─→ navigator.clipboard.writeText()
    └─→ setCopiedType(type)

Regenerate Click
    │
    └─→ onRegenerate() → handleGenerate() again

Use Selected Click
    │
    ├─→ onUseSelected(selectedHeadlines, selectedDescriptions)
    ├─→ handleUseGeneratedCopy()
    ├─→ addHeadline() for each
    ├─→ addDescription() for each
    ├─→ success(toast message)
    └─→ onClose()

Test Connection Click
    │
    ├─→ testOpenaiConnection() or testClaudeConnection()
    ├─→ Validate API key format
    └─→ setTestResult('success' | 'error')

Save Settings Click
    │
    ├─→ setOpenaiKey(value)
    ├─→ setClaudeKey(value)
    ├─→ setDefaultProvider(value)
    └─→ setSaveSuccess(true)
```

---

## API Call Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPENAI API FLOW                              │
└─────────────────────────────────────────────────────────────────┘

generateAdCopy({ provider: 'openai', ... })
    │
    ├─→ generateHeadlines()
    │   │
    │   ├─→ getOpenAIClient()
    │   │   ├─→ Check AI_CONFIG.openai.apiKey
    │   │   └─→ new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    │   │
    │   ├─→ buildHeadlinePrompt(request)
    │   │   └─→ Returns formatted prompt string
    │   │
    │   ├─→ callOpenAI(prompt)
    │   │   ├─→ client.chat.completions.create({
    │   │   │       model: 'gpt-4-turbo-preview',
    │   │   │       messages: [{ role: 'user', content: prompt }],
    │   │   │       max_tokens: 500,
    │   │   │       temperature: 0.7
    │   │   │   })
    │   │   └─→ Returns response.choices[0].message.content
    │   │
    │   ├─→ parseHeadlines(response)
    │   │   ├─→ Split by newline
    │   │   ├─→ Remove numbering
    │   │   ├─→ Remove markdown
    │   │   └─→ Filter by validateHeadline()
    │   │
    │   └─→ Returns: string[] (max 30 chars each)
    │
    └─→ generateDescriptions()
        │
        ├─→ getOpenAIClient()
        ├─→ buildDescriptionPrompt(request)
        ├─→ callOpenAI(prompt)
        ├─→ parseDescriptions(response)
        └─→ Returns: string[] (max 90 chars each)

Returns: { headlines, descriptions, generatedAt, provider }


┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE API FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Similar flow but with:
    callClaude(prompt)
        ├─→ client.messages.create({
        │       model: 'claude-3-5-sonnet-20241022',
        │       max_tokens: 500,
        │       messages: [{ role: 'user', content: prompt }]
        │   })
        └─→ Returns textContent.text
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR TYPES                                 │
└─────────────────────────────────────────────────────────────────┘

1. PROVIDER_NOT_CONFIGURED
    │
    ├─→ isProviderConfigured() returns false
    ├─→ Throw AIServiceError
    ├─→ useAIGeneration catches error
    ├─→ formatAIError() converts to user message
    ├─→ setError("AI provider is not configured...")
    └─→ Modal shows error alert

2. AUTH_ERROR (401)
    │
    ├─→ API returns 401
    ├─→ Throw AIServiceError('AUTH_ERROR')
    └─→ Show: "Authentication failed. Please check your API key."

3. RATE_LIMIT (429)
    │
    ├─→ API returns 429
    ├─→ Throw AIServiceError('RATE_LIMIT')
    └─→ Show: "Rate limit exceeded. Please try again..."

4. API_ERROR (500, 503)
    │
    ├─→ API returns 500/503
    ├─→ Throw AIServiceError('API_ERROR')
    └─→ Show: "AI service is temporarily unavailable..."

5. TIMEOUT
    │
    ├─→ Promise.race timeout (30 seconds)
    ├─→ Throw AIServiceError('TIMEOUT')
    └─→ Show: "Request timed out. Please try again."

6. INVALID_RESPONSE
    │
    ├─→ parseHeadlines() returns empty array
    ├─→ Throw AIServiceError('INVALID_RESPONSE')
    └─→ Show: "Failed to generate valid ad copy..."

7. VALIDATION_ERROR
    │
    ├─→ validateForm() finds errors
    ├─→ setValidationErrors({ field: 'Error message' })
    ├─→ Show inline field errors
    └─→ Prevent form submission


Error Display Hierarchy:
1. Validation Errors → Inline on form fields (red border + message)
2. API Errors → Alert box at top of modal (red background)
3. No Config Warning → Yellow warning box (before form)
```

---

## Component Communication

```
Parent → Child Props:
    AdBuilder
        └─→ AIGenerationModal
            ├─→ isOpen: boolean
            ├─→ onClose: () => void
            ├─→ onUseGenerated: (headlines, descriptions) => void
            ├─→ initialBusinessDescription: string
            └─→ initialKeywords: string[]

    AIGenerationModal
        └─→ AIGenerationResults
            ├─→ headlines: string[]
            ├─→ descriptions: string[]
            ├─→ onUseSelected: (headlines, descriptions) => void
            ├─→ onRegenerate: () => void
            └─→ isRegenerating: boolean

Child → Parent Callbacks:
    AIGenerationResults
        ├─→ onUseSelected() → AIGenerationModal
        └─→ onRegenerate() → AIGenerationModal

    AIGenerationModal
        ├─→ onClose() → AdBuilder
        └─→ onUseGenerated() → AdBuilder

Hooks → Components:
    useAIGeneration
        ├─→ Provides: { isGenerating, generatedCopy, error, ... }
        └─→ Used by: AIGenerationModal

    useLocalStorage
        ├─→ Provides: [value, setValue, removeValue]
        └─→ Used by: AISettings, AIGenerationModal

Store → Components:
    useCampaignStore
        ├─→ addHeadline()
        ├─→ addDescription()
        └─→ Used by: AdBuilder.handleUseGeneratedCopy()
```

---

## Styling Architecture

```
Component Styling Approach: Tailwind CSS Utility Classes

Base Button Styles (AIGenerateButton):
├─→ Gradient: bg-gradient-to-r from-purple-600 to-blue-600
├─→ Hover: hover:from-purple-700 hover:to-blue-700
├─→ Shadow: shadow-md hover:shadow-lg
├─→ Transition: transition-all duration-200
└─→ Focus: focus:ring-2 focus:ring-offset-2 focus:ring-purple-500

Form Input Styles:
├─→ Base: w-full px-3 py-2 border rounded-lg
├─→ Focus: focus:ring-2 focus:ring-blue-500 focus:border-transparent
├─→ Error: border-red-500 (when validation fails)
└─→ Disabled: disabled:opacity-50 disabled:cursor-not-allowed

Modal Styles:
├─→ Backdrop: fixed inset-0 bg-black bg-opacity-50
├─→ Container: max-w-4xl bg-white rounded-lg shadow-xl
└─→ Animation: transition-all transform

Results List Styles:
├─→ Container: border border-gray-200 rounded-lg divide-y
├─→ Item: p-3 hover:bg-gray-50 transition-colors
├─→ Selected: bg-blue-50
└─→ Scrollable: max-h-80 overflow-y-auto

Character Count Colors:
├─→ Green (0-80%): text-green-600
├─→ Yellow (80-95%): text-yellow-600
└─→ Red (95-100%): text-red-600

Responsive Design:
├─→ Desktop: grid-cols-2, side-by-side layout
├─→ Tablet: grid-cols-1, stacked layout
└─→ Mobile: full-screen modal, touch-friendly targets
```

---

## File Dependencies

```
AIGenerateButton.tsx
├─→ lucide-react (Sparkles, Loader2)
└─→ React

AIGenerationModal.tsx
├─→ React (useState, useEffect, useRef)
├─→ lucide-react (ChevronDown, ChevronUp, AlertCircle, Loader2, Sparkles)
├─→ @/components/common/Modal
├─→ @/components/common/Button
├─→ @/components/ads/AIGenerationResults
├─→ @/hooks/useAIGeneration
├─→ @/hooks/useLocalStorage
└─→ @/services/aiService (types)

AIGenerationResults.tsx
├─→ React (useState)
├─→ lucide-react (Copy, Check, RefreshCw, ArrowRight)
└─→ @/utils/constants (CHAR_LIMITS)

AISettings.tsx
├─→ React (useState)
├─→ lucide-react (Eye, EyeOff, CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink)
├─→ @/hooks/useLocalStorage
└─→ @/components/common/Button

useLocalStorage.ts
└─→ React (useState, useEffect, useCallback)

Settings.tsx
├─→ React
├─→ react-router-dom (useNavigate)
├─→ lucide-react (ArrowLeft)
├─→ @/components/settings/AISettings
└─→ @/components/common/PageHeader

AdBuilder.tsx (updated)
├─→ React (useState, useEffect) [NEW]
├─→ @/components/ads/AIGenerateButton [NEW]
├─→ @/components/modals/AIGenerationModal [NEW]
└─→ (existing dependencies...)

aiConfig.ts (updated)
├─→ Vite import.meta.env
└─→ localStorage API
```

---

This architecture provides a complete view of how all the AI copy generation components connect and communicate!
