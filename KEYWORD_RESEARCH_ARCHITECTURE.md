# Keyword Research UI - Component Architecture

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     AdGroupBuilder Page                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              KeywordManager Component                  │    │
│  │                                                        │    │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │    │
│  │  │ KeywordResearch  │  │  Add Keyword Button      │  │    │
│  │  │ Button (NEW)     │  │  (existing)              │  │    │
│  │  └──────────────────┘  └──────────────────────────┘  │    │
│  │                                                        │    │
│  │  [List of existing keywords...]                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│   KeywordResearchModal (Conditional - when open)              │
│  │                                                       │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │         PHASE 1: INPUT                      │     │    │
│  │  │                                             │     │    │
│  │  │  Seed Keywords:     [___________________]  │     │    │
│  │  │  Business:          [___________________]  │     │    │
│  │  │  Location:          [___________________]  │     │    │
│  │  │  AI Provider:       [OpenAI ▼]            │     │    │
│  │  │  Max Results:       [100]                  │     │    │
│  │  │                                             │     │    │
│  │  │  [Cancel]  [Research Keywords →]           │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                        ↓                              │    │
│  │               (10-20 second wait)                     │    │
│  │                        ↓                              │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │         PHASE 2: RESULTS                    │     │    │
│  │  │                                             │     │    │
│  │  │  ┌───────────────────────────────────────┐ │     │    │
│  │  │  │   KeywordResearchResults Component    │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  🔍 [Search...] [Category▼] [Sort▼] │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  ☑ Selected: 15 keywords             │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  ┌────────────────────────────────┐  │ │     │    │
│  │  │  │  │ ☑ premium plumbing    Score: 95│  │ │     │    │
│  │  │  │  │   ☑ Exact ☑ Phrase ☐ Broad    │  │ │     │    │
│  │  │  │  │   Commercial • Long-tail        │  │ │     │    │
│  │  │  │  │                                 │  │ │     │    │
│  │  │  │  │ ☑ emergency plumber   Score: 87│  │ │     │    │
│  │  │  │  │   ☑ Exact ☑ Phrase ☑ Broad    │  │ │     │    │
│  │  │  │  │   Local • Commercial            │  │ │     │    │
│  │  │  │  │                                 │  │ │     │    │
│  │  │  │  │ ☐ plumbing tips       Score: 62│  │ │     │    │
│  │  │  │  │   ☑ Exact ☑ Phrase ☐ Broad    │  │ │     │    │
│  │  │  │  │   Informational                 │  │ │     │    │
│  │  │  │  │                                 │  │ │     │    │
│  │  │  │  │   ...more keywords...           │  │ │     │    │
│  │  │  │  └────────────────────────────────┘  │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  [Select All] [Deselect All]         │ │     │    │
│  │  │  └───────────────────────────────────────┘ │     │    │
│  │  │                                             │     │    │
│  │  │  ┌───────────────────────────────────────┐ │     │    │
│  │  │  │  NegativeKeywordsPanel Component      │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  ⚠️  Negative Keywords (12)  [Hide▲] │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  ☑ free        (filters free options)│ │     │    │
│  │  │  │  ☑ diy         (filters DIY searches)│ │     │    │
│  │  │  │  ☐ job         (filters job seekers) │ │     │    │
│  │  │  │  ...more negatives...                 │ │     │    │
│  │  │  │                                       │ │     │    │
│  │  │  │  [Select All] [Add Selected]         │ │     │    │
│  │  │  └───────────────────────────────────────┘ │     │    │
│  │  │                                             │     │    │
│  │  │  [Back] [Export CSV] [Add 15 to Ad Group] │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Relationships

### Parent-Child Hierarchy

```
AdGroupBuilder (Page)
├── KeywordManager
│   └── KeywordResearchButton
│       └── (triggers modal)
│
└── KeywordResearchModal
    ├── Phase 1: Input Form
    │   ├── Seed Keywords Input
    │   ├── Business Description Textarea
    │   ├── Location Input
    │   ├── AI Provider Select
    │   └── Max Results Input
    │
    └── Phase 2: Results
        ├── KeywordResearchResults
        │   ├── Search Input
        │   ├── Category Filter
        │   ├── Sort Dropdown
        │   ├── Selection Summary
        │   └── Keyword List
        │       └── KeywordRow (repeated)
        │           ├── Checkbox
        │           ├── Keyword Text
        │           ├── Relevance Score Badge
        │           ├── Match Type Toggles
        │           └── Category Badges
        │
        └── NegativeKeywordsPanel
            ├── Collapse/Expand Button
            ├── Negative Keyword List
            │   └── NegativeKeywordRow (repeated)
            │       ├── Checkbox
            │       └── Description
            │
            └── Action Buttons
```

## Data Flow Diagram

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │ clicks "Research Keywords"
       ↓
┌──────────────────────────┐
│  KeywordResearchButton   │
└──────┬───────────────────┘
       │ onClick()
       ↓
┌──────────────────────────┐
│ AdGroupBuilder.tsx       │
│ handleOpenKeywordResearch│
└──────┬───────────────────┘
       │ setIsKeywordResearchModalOpen(true)
       ↓
┌─────────────────────────────────────┐
│   KeywordResearchModal (INPUT)      │
│   - User enters seed keywords       │
│   - User enters business context    │
│   - User selects AI provider        │
└──────┬──────────────────────────────┘
       │ handleResearch()
       ↓
┌─────────────────────────────────────┐
│   useKeywordResearch Hook           │
│   - research(request)               │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  keywordResearchService             │
│  - researchKeywords()               │
│    ├── AI generation (OpenAI/Claude)│
│    ├── Keyword expansion            │
│    ├── Long-tail generation         │
│    ├── Negative keyword suggestions │
│    ├── Relevance scoring            │
│    └── Categorization               │
└──────┬──────────────────────────────┘
       │ return KeywordResearchResult
       ↓
┌─────────────────────────────────────┐
│ useKeywordResearch Hook             │
│ - setState({ results, phase })      │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ KeywordResearchModal (RESULTS)      │
│   ├── KeywordResearchResults        │
│   │   - Display keywords            │
│   │   - Filter/sort/search          │
│   │   - Select keywords             │
│   │   - Toggle match types          │
│   │                                 │
│   └── NegativeKeywordsPanel         │
│       - Display negatives           │
│       - Select negatives            │
└──────┬──────────────────────────────┘
       │ User clicks "Add to Ad Group"
       ↓
┌─────────────────────────────────────┐
│ AdGroupBuilder.tsx                  │
│ handleAddKeywordsFromResearch()     │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ useCampaignStore                    │
│ addKeywords(campaignId, adGroupId,  │
│             keywords[])             │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Store Updated                       │
│ - Keywords added to ad group        │
│ - Component re-renders              │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ KeywordManager                      │
│ - Displays new keywords             │
│ - Shows updated count               │
└─────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Toast Notification                  │
│ "Added 15 keywords to ad group"     │
└─────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Component State                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AdGroupBuilder (Page Level)                           │
│  ├── isKeywordResearchModalOpen: boolean               │
│  └── selectedAdIds: string[]                           │
│                                                         │
│  KeywordResearchModal (Modal Level)                    │
│  ├── phase: 'input' | 'results'                        │
│  ├── seedKeywords: string                              │
│  ├── businessDescription: string                       │
│  ├── targetLocation: string                            │
│  ├── maxResults: number                                │
│  ├── provider: AIProvider                              │
│  ├── matchTypeSettings: Record<string, MatchTypes>     │
│  └── selectedNegatives: string[]                       │
│                                                         │
│  useKeywordResearch Hook (Shared State)                │
│  ├── isResearching: boolean                            │
│  ├── results: KeywordResearchResult | null             │
│  ├── error: string | null                              │
│  ├── selectedKeywords: string[]                        │
│  └── [helper methods]                                  │
│                                                         │
│  KeywordResearchResults (Component Level)              │
│  ├── searchQuery: string                               │
│  ├── categoryFilter: CategoryFilter                    │
│  └── sortBy: SortOption                                │
│                                                         │
│  NegativeKeywordsPanel (Component Level)               │
│  └── isExpanded: boolean                               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Global Store                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  useCampaignStore (Zustand)                            │
│  ├── campaigns: Campaign[]                             │
│  ├── getCampaign()                                     │
│  ├── getAdGroup()                                      │
│  ├── addKeyword()                                      │
│  ├── addKeywords() ← NEW                               │
│  ├── updateKeyword()                                   │
│  └── deleteKeyword()                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Event Flow Sequence

### 1. Opening Modal
```
User Action: Click "Research Keywords" button
                    ↓
Button Component: KeywordResearchButton
  └─> onClick event
                    ↓
Parent Handler: handleOpenKeywordResearch()
  └─> setIsKeywordResearchModalOpen(true)
                    ↓
React Re-render: Modal appears
  └─> Focus on first input field
```

### 2. Researching Keywords
```
User Action: Fill form + click "Research Keywords"
                    ↓
Form Validation: Check required fields
  └─> seedKeywords.length > 0
                    ↓
Modal Handler: handleResearch()
  └─> research({ provider, seedKeywords, ... })
                    ↓
Hook: useKeywordResearch
  └─> setState({ isResearching: true })
                    ↓
Service: keywordResearchService.researchKeywords()
  ├─> AI Generation (10-20s)
  ├─> Keyword Expansion
  ├─> Long-tail Generation
  ├─> Scoring & Categorization
  └─> return results
                    ↓
Hook: useKeywordResearch
  └─> setState({ results, isResearching: false })
                    ↓
Modal: Switch phase to 'results'
  └─> Initialize matchTypeSettings
                    ↓
React Re-render: Results phase displayed
```

### 3. Selecting & Adding Keywords
```
User Action: Select keywords, toggle match types
                    ↓
Results Component: KeywordResearchResults
  └─> onToggleKeyword() for each selection
  └─> onMatchTypeChange() for each toggle
                    ↓
Hook: useKeywordResearch
  └─> selectedKeywords state updated
                    ↓
Modal: matchTypeSettings state updated
                    ↓
User Action: Click "Add to Ad Group"
                    ↓
Modal Handler: handleAddToAdGroup()
  └─> Build keywords array with match types
                    ↓
Parent Callback: onAddKeywords(keywords)
                    ↓
Page Handler: handleAddKeywordsFromResearch()
  └─> Convert to Keyword entities
  └─> addKeywords(campaignId, adGroupId, keywords)
                    ↓
Store: useCampaignStore
  └─> Add keywords to ad group
  └─> Update timestamp
  └─> Trigger re-render
                    ↓
Modal: onClose()
                    ↓
Toast: Show success message
                    ↓
KeywordManager: Display updated keyword list
```

## Component Props Interface Map

```typescript
// KeywordResearchButton
interface KeywordResearchButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

// KeywordResearchModal
interface KeywordResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKeywords: (keywords: Array<{
    text: string;
    matchTypes: MatchTypeSettings;
  }>) => void;
  initialKeywords?: string[];
  businessContext?: string;
}

// KeywordResearchResults
interface KeywordResearchResultsProps {
  keywords: KeywordSuggestion[];
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  matchTypeSettings: Record<string, MatchTypeSettings>;
  onMatchTypeChange: (
    keyword: string,
    matchType: 'exact' | 'phrase' | 'broad',
    enabled: boolean
  ) => void;
}

// NegativeKeywordsPanel
interface NegativeKeywordsPanelProps {
  negativeKeywords: string[];
  selectedNegatives: string[];
  onToggleNegative: (keyword: string) => void;
  onAddSelected?: () => void;
}
```

## Service Integration Map

```
KeywordResearchModal
        │
        ├─> useKeywordResearch (Hook)
        │        │
        │        └─> keywordResearchService
        │                  │
        │                  ├─> AI Services
        │                  │     ├─> OpenAI
        │                  │     └─> Claude
        │                  │
        │                  ├─> Keyword Utilities
        │                  │     ├─> expandKeywords()
        │                  │     ├─> generateLongTailKeywords()
        │                  │     ├─> suggestNegativeKeywords()
        │                  │     └─> scoreKeywordRelevance()
        │                  │
        │                  └─> Export Utilities
        │                        ├─> exportKeywordsToCsv()
        │                        └─> formatKeywordsForClipboard()
        │
        └─> useCampaignStore (Global State)
                 │
                 └─> addKeywords() method
```

## File Dependency Graph

```
AdGroupBuilder.tsx
├── imports KeywordResearchModal
├── imports useToast
├── imports useCampaignStore
└── imports types from services

KeywordResearchModal.tsx
├── imports Modal (common)
├── imports KeywordResearchResults
├── imports NegativeKeywordsPanel
├── imports useKeywordResearch (hook)
├── imports exportKeywordsToCsv (service)
├── imports types from services
└── imports icons from lucide-react

KeywordResearchResults.tsx
├── imports types from services
└── imports icons from lucide-react

NegativeKeywordsPanel.tsx
└── imports icons from lucide-react

KeywordResearchButton.tsx
└── imports icons from lucide-react

useKeywordResearch.ts (existing)
└── imports keywordResearchService

keywordResearchService.ts (existing)
├── imports aiService
├── imports aiConfig
├── imports OpenAI SDK
└── imports Anthropic SDK
```

## Code Metrics

### Component Sizes
```
KeywordResearchButton.tsx       ~40 lines
NegativeKeywordsPanel.tsx      ~130 lines
KeywordResearchResults.tsx     ~350 lines
KeywordResearchModal.tsx       ~430 lines
─────────────────────────────────────────
Total New Code:                ~950 lines
```

### Modified Files
```
AdGroupBuilder.tsx             +50 lines
KeywordManager.tsx             +10 lines
useCampaignStore.ts            +25 lines
modals/index.ts                 +3 lines
─────────────────────────────────────────
Total Modified:                ~88 lines
```

### Grand Total
```
New Components:      950 lines
Modified Files:       88 lines
Documentation:     2,500+ lines
─────────────────────────────────────────
Total Contribution: 3,538+ lines
```

---

**Architecture Version**: 1.0.0
**Last Updated**: November 1, 2025
**Status**: Production Ready
