# Keyword Research UI - Testing Guide

## Overview
This document provides a comprehensive testing checklist for the new Keyword Research feature.

## Components Created

### 1. Core Components
- [x] `KeywordResearchButton.tsx` - Button to trigger research modal
- [x] `KeywordResearchModal.tsx` - Main modal with input and results phases
- [x] `KeywordResearchResults.tsx` - Results display with filtering/sorting
- [x] `NegativeKeywordsPanel.tsx` - Negative keywords suggestions panel

### 2. Store Updates
- [x] `useCampaignStore.ts` - Added `addKeywords()` for bulk operations

### 3. Integration
- [x] `AdGroupBuilder.tsx` - Integrated research button and modal
- [x] `KeywordManager.tsx` - Added research button to header

## Testing Checklist

### Phase 1: Input Form Testing

#### Basic Form Validation
- [ ] Open keyword research modal (click "Research Keywords" button)
- [ ] Verify "Research Keywords" button is disabled when seed keywords are empty
- [ ] Enter seed keywords (e.g., "plumbing, emergency plumber")
- [ ] Verify button becomes enabled
- [ ] Enter business description (optional)
- [ ] Enter target location (optional)
- [ ] Change max results (test min: 50, max: 200)
- [ ] Select different AI provider (OpenAI vs Claude)

#### Edge Cases
- [ ] Try submitting with empty seed keywords - should show validation
- [ ] Try max results < 50 - should enforce minimum
- [ ] Try max results > 200 - should enforce maximum
- [ ] Test with special characters in keywords
- [ ] Test with very long business description

#### Keyboard Shortcuts
- [ ] Press `Ctrl/Cmd + K` to open modal from Ad Group Builder page
- [ ] Press `Escape` to close modal
- [ ] Press `Enter` in seed keywords field to submit form

### Phase 2: Research Execution

#### Loading States
- [ ] Click "Research Keywords" button
- [ ] Verify loading spinner appears
- [ ] Verify form fields are disabled during research
- [ ] Verify progress message "Researching keywords..."
- [ ] Wait for research to complete (10-20 seconds)

#### Error Handling
- [ ] Test with invalid AI provider configuration
- [ ] Test with network disconnection
- [ ] Verify error messages are user-friendly
- [ ] Verify user can retry after error

### Phase 3: Results Display

#### Results Overview
- [ ] Verify success message shows: "Found X keywords and Y negative keywords"
- [ ] Verify keywords are displayed in a scrollable list
- [ ] Verify each keyword shows:
  - [ ] Checkbox for selection
  - [ ] Keyword text
  - [ ] Character count
  - [ ] Relevance score (color-coded)
  - [ ] Match type toggles (Exact, Phrase, Broad)
  - [ ] Category badge
  - [ ] Long-tail badge (if applicable)

#### Relevance Score Colors
- [ ] Score >= 80: Green background
- [ ] Score 60-79: Yellow background
- [ ] Score < 60: Gray background

#### Category Badges
- [ ] Commercial: Blue
- [ ] Local: Purple
- [ ] Informational: Orange
- [ ] Comparison: Pink
- [ ] Product: Green

### Phase 4: Filtering & Sorting

#### Search Filter
- [ ] Enter text in search box
- [ ] Verify real-time filtering of keywords
- [ ] Click X button to clear search
- [ ] Verify all keywords return

#### Category Filter
- [ ] Select "All Categories" - shows all
- [ ] Select "Commercial" - shows only commercial keywords
- [ ] Select "Local" - shows only local keywords
- [ ] Test each category filter

#### Sort Options
- [ ] Sort by "Relevance" (default) - highest score first
- [ ] Sort by "Alphabetical" - A-Z order
- [ ] Sort by "Length" - shortest to longest
- [ ] Verify sort persists when filtering

### Phase 5: Keyword Selection

#### Individual Selection
- [ ] Click checkbox on individual keyword
- [ ] Verify keyword is selected (blue background)
- [ ] Verify counter updates: "X selected"
- [ ] Click again to deselect
- [ ] Verify counter updates

#### Bulk Selection
- [ ] Click "Select All" button
- [ ] Verify all visible keywords are selected
- [ ] Apply a filter, then "Select All"
- [ ] Verify only visible keywords are selected
- [ ] Click "Deselect All"
- [ ] Verify all keywords are deselected

#### Selection with Filtering
- [ ] Select several keywords
- [ ] Apply a filter
- [ ] Verify selection persists
- [ ] Select more keywords with filter active
- [ ] Clear filter
- [ ] Verify all selections are maintained

### Phase 6: Match Type Selection

#### Default Match Types
- [ ] Single word keyword: Verify Exact only checked by default
- [ ] 2-3 word keyword: Verify Exact + Phrase checked
- [ ] 4+ word keyword: Verify Exact + Phrase + Broad checked

#### Toggle Match Types
- [ ] Click Exact checkbox to toggle
- [ ] Click Phrase checkbox to toggle
- [ ] Click Broad checkbox to toggle
- [ ] Select keyword with different combinations
- [ ] Verify at least one match type can be selected

### Phase 7: Negative Keywords Panel

#### Panel Display
- [ ] Verify "Negative Keywords (X)" panel shows
- [ ] Click to collapse panel
- [ ] Click to expand panel
- [ ] Verify suggestion descriptions show

#### Negative Selection
- [ ] Select individual negative keyword
- [ ] Verify checkbox updates
- [ ] Click "Select All" in negative panel
- [ ] Verify all negatives selected
- [ ] Click "Deselect All"
- [ ] Verify all negatives deselected

### Phase 8: Export Functionality

#### CSV Export
- [ ] Select several keywords
- [ ] Click "Export CSV" button
- [ ] Verify CSV file downloads
- [ ] Open CSV in Excel/Sheets
- [ ] Verify columns:
  - [ ] Keyword
  - [ ] Relevance Score
  - [ ] Category
  - [ ] Exact Match (Yes/No)
  - [ ] Phrase Match (Yes/No)
  - [ ] Broad Match (Yes/No)
  - [ ] Is Long Tail (Yes/No)
- [ ] Verify data is accurate

#### Export with No Selection
- [ ] Deselect all keywords
- [ ] Verify "Export CSV" button is disabled

### Phase 9: Add Keywords to Ad Group

#### Adding Keywords
- [ ] Select multiple keywords
- [ ] Toggle various match types
- [ ] Click "Add X to Ad Group" button
- [ ] Verify modal closes
- [ ] Verify toast notification: "Added X keywords to ad group"
- [ ] Verify keywords appear in Keywords section
- [ ] Verify match types are preserved (currently simplified in store)

#### Add with No Selection
- [ ] Deselect all keywords
- [ ] Verify "Add to Ad Group" button is disabled

### Phase 10: Keyboard Shortcuts

#### Global Shortcuts
- [ ] `Ctrl/Cmd + K`: Opens keyword research modal
- [ ] `Escape`: Closes modal
- [ ] `Enter`: Submits research form (input phase)

#### Results Phase Shortcuts
- [ ] `Ctrl/Cmd + A`: Select all keywords
- [ ] `Escape`: Deselect all OR close modal

### Phase 11: Accessibility

#### Screen Reader Support
- [ ] Tab through all form fields
- [ ] Verify focus indicators are visible
- [ ] Verify ARIA labels on buttons
- [ ] Verify form field labels are properly associated
- [ ] Test with screen reader (VoiceOver, NVDA, JAWS)

#### Keyboard Navigation
- [ ] Navigate entire modal using only keyboard
- [ ] Tab through keywords list
- [ ] Space to toggle checkboxes
- [ ] Enter to activate buttons

#### Focus Management
- [ ] Open modal - focus on first input field
- [ ] Submit research - focus maintained
- [ ] Navigate with Tab - logical order
- [ ] Close modal - focus returns to trigger button

### Phase 12: Responsive Design

#### Desktop (1920px+)
- [ ] Modal displays properly centered
- [ ] All controls visible
- [ ] Columns aligned correctly
- [ ] Scrolling works smoothly

#### Tablet (768px - 1024px)
- [ ] Modal adapts to screen size
- [ ] Controls stack appropriately
- [ ] Match type toggles remain usable
- [ ] Touch targets are adequate

#### Mobile (< 768px)
- [ ] Modal fills screen
- [ ] Filters stack vertically
- [ ] Match type toggles stack
- [ ] Checkboxes are touch-friendly
- [ ] Scrolling works on mobile
- [ ] No horizontal overflow

### Phase 13: Integration Testing

#### Full Workflow
1. [ ] Navigate to Ad Group Builder
2. [ ] Click "Research Keywords" button (or Ctrl+K)
3. [ ] Enter seed keywords
4. [ ] Enter business description
5. [ ] Click "Research Keywords"
6. [ ] Wait for results
7. [ ] Filter by category
8. [ ] Search for specific keywords
9. [ ] Select desired keywords
10. [ ] Toggle match types
11. [ ] Select negative keywords
12. [ ] Export to CSV
13. [ ] Add keywords to ad group
14. [ ] Verify keywords in keyword list
15. [ ] Verify toast notification

#### Edge Cases
- [ ] Research with existing keywords pre-filled
- [ ] Add keywords to ad group with existing keywords
- [ ] Research multiple times in same session
- [ ] Switch between input and results phases
- [ ] Cancel and restart research

### Phase 14: Performance

#### Loading Performance
- [ ] Research completes in < 30 seconds
- [ ] UI remains responsive during research
- [ ] Large result sets (200+ keywords) render smoothly
- [ ] Filtering/sorting is instant
- [ ] No memory leaks on repeated use

#### User Experience
- [ ] No layout shift during loading
- [ ] Smooth animations and transitions
- [ ] Progress indicators are clear
- [ ] Error messages are helpful

## Known Limitations

1. **Match Types Storage**: Currently, match types are defined in the research but the Keyword entity in the store doesn't persist them separately. Keywords are added as text only.

2. **Negative Keywords**: Selected negative keywords are tracked in the modal but not currently added to the ad group (would require additional store methods).

3. **API Key Configuration**: Requires valid OpenAI or Claude API key configured in `.env.local`.

## Success Criteria

- [ ] All Phase 1-13 tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No accessibility violations
- [ ] Responsive on all screen sizes
- [ ] Professional UX with clear feedback
- [ ] Feature enhances workflow efficiency

## Demo Script

### Quick Demo (5 minutes)
1. Open Ad Group Builder
2. Click "Research Keywords"
3. Enter: "emergency plumber, leak repair"
4. Enter business: "24/7 plumbing service"
5. Click "Research Keywords"
6. Show results with filtering
7. Select top 10 keywords
8. Toggle match types
9. Export to CSV
10. Add to ad group
11. Show keywords in list

### Full Demo (15 minutes)
- Include all features
- Show error handling
- Demonstrate keyboard shortcuts
- Show mobile responsiveness
- Export and import workflow

## Bug Reporting Template

```
**Title**: [Brief description]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Screenshots**: (if applicable)

**Environment**:
- Browser:
- OS:
- Screen Size:
```

## Future Enhancements

- [ ] Save keyword research history
- [ ] Compare multiple research sessions
- [ ] Import keywords from file
- [ ] Keyword difficulty scoring
- [ ] Competitor keyword analysis
- [ ] Search volume data (when API available)
- [ ] Negative keyword management in ad group
- [ ] Bulk edit match types
- [ ] Keyword grouping suggestions
- [ ] Performance predictions

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
**Status**: Ready for Testing
