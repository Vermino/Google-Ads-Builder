# Modal Visual Reference

## Modal Component Structure

All modals follow this consistent structure:

```
┌─────────────────────────────────────────────────────┐
│  Modal Title                                    [X] │  ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│  Form Content Area                                  │  ← Body
│  - Input fields                                     │
│  - Checkboxes                                       │
│  - Dropdowns                                        │
│  - Helper text                                      │
│  - Error messages                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                           [Cancel] [Primary Action] │  ← Footer
└─────────────────────────────────────────────────────┘
```

---

## NewCampaignModal Layout

```
┌──────────────────────────────────────────────────────────┐
│  Create New Campaign                                [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Campaign Name *                                         │
│  [_____________________________________________]          │
│                                                          │
│  Budget ($) *              Campaign Status               │
│  [__________]              [Active ▼]                    │
│                                                          │
│  ☑ Daily Budget                                          │
│                                                          │
│  Location Targeting *                                    │
│  [_____________________________________________]          │
│                                                          │
│  Final URL *                                             │
│  [_____________________________________________]          │
│  The URL where users will land after clicking your ad    │
│                                                          │
│  Path 1 (Optional)         Path 2 (Optional)            │
│  [__________]              [__________]                  │
│  Max 15 characters         Max 15 characters             │
│                                                          │
│  Start Date (Optional)     End Date (Optional)          │
│  [2024-10-31]              [          ]                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                    [Cancel] [Create      │
│                                              Campaign]   │
└──────────────────────────────────────────────────────────┘
```

**Form Fields:**
- **Campaign Name**: Text input, required, min 3 chars
- **Budget**: Number input, required, min $1
- **Daily Budget**: Checkbox, default checked
- **Campaign Status**: Dropdown (Active/Paused), default Active
- **Location Targeting**: Text input, required, default "United States"
- **Final URL**: Text input, required, URL validation
- **Path 1 & 2**: Text inputs, optional, max 15 chars each
- **Start/End Date**: Date inputs, optional

---

## NewAdGroupModal Layout

```
┌──────────────────────────────────────────────────────────┐
│  Create New Ad Group                                [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Ad Group Name *                                         │
│  [_____________________________________________]          │
│                                                          │
│  Max CPC ($) *             Ad Group Status               │
│  [__________]              [Active ▼]                    │
│  Default bid for keywords in this ad group               │
│                                                          │
│  Match Types                                             │
│  ┌────────────────────────────────────────────────┐     │
│  │ ☑ Exact Match - Precise searches only         │     │
│  │ ☑ Phrase Match - Keyword phrase in query      │     │
│  │ ☐ Broad Match - Related searches              │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Match Type Bid Modifiers (Optional)                    │
│  Adjust bids by percentage for each match type.         │
│  Positive values increase bids, negative decrease.      │
│                                                          │
│  Exact (%)      Phrase (%)      Broad (%)               │
│  [__________]   [__________]    [__________]            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                    [Cancel] [Create Ad   │
│                                                   Group] │
└──────────────────────────────────────────────────────────┘
```

**Form Fields:**
- **Ad Group Name**: Text input, required, min 3 chars
- **Max CPC**: Number input, required, min $0.01, step 0.01
- **Ad Group Status**: Dropdown (Active/Paused), default Active
- **Match Types**: Checkboxes (Exact/Phrase/Broad), at least one required
- **Modifiers**: Number inputs, disabled if match type unchecked

---

## NewAdModal Layout

```
┌──────────────────────────────────────────────────────────┐
│  Create New Ad                                      [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ ℹ Ad Content Builder                           │     │
│  │ This will create a blank ad structure. You'll  │     │
│  │ add headlines, descriptions, and other content │     │
│  │ in the Ad Builder page.                        │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Ad Name (Optional)                                      │
│  [_____________________________________________]          │
│  Internal reference name for this ad                     │
│                                                          │
│  Ad Type                                                 │
│  [Responsive Search Ad (RSA) ▼] 🔒                       │
│  Responsive Search Ads automatically test different     │
│  combinations of your headlines and descriptions         │
│                                                          │
│  Ad Status                                               │
│  [Enabled ▼]                                             │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ Default Settings                               │     │
│  │ Final URL: https://www.example.com/summer-sale │     │
│  │ Path 1: summer                                 │     │
│  │ Path 2: sale                                   │     │
│  │                                                │     │
│  │ These values are inherited from the campaign.  │     │
│  │ You can customize them in the Ad Builder.      │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                    [Cancel] [Create Ad]  │
└──────────────────────────────────────────────────────────┘
```

**Form Fields:**
- **Ad Name**: Text input, optional (auto-generated if empty)
- **Ad Type**: Dropdown, RSA only, disabled
- **Ad Status**: Dropdown (Enabled/Paused/Disabled), default Enabled
- **Default Settings**: Read-only display of inherited campaign settings

---

## Field States

### Normal State
```
Label
[___________________________]
Helper text (if applicable)
```

### With Value
```
Label
[Summer Sale 2024__________]
Helper text (if applicable)
```

### Error State
```
Label
[___________________________] ← Red border
❌ Error message in red text
```

### Disabled State
```
Label
[Responsive Search Ad (RSA) ▼] 🔒 ← Gray background
Helper text (if applicable)
```

### With Character Counter
```
Label                          3/15
[sum________________________]
Helper text
```

---

## Button States

### Primary Button (Create Action)
```
Normal:   [  Create Campaign  ] ← Blue background, white text
Hover:    [  Create Campaign  ] ← Darker blue background
Disabled: [  Create Campaign  ] ← Gray background, reduced opacity
```

### Secondary Button (Cancel)
```
Normal:   [  Cancel  ] ← White background, gray border
Hover:    [  Cancel  ] ← Light gray background
```

---

## Validation Error Examples

### Campaign Name Error
```
Campaign Name *
[__] ← Red border
❌ Campaign name must be at least 3 characters
```

### Budget Error
```
Budget ($) *
[0.50] ← Red border
❌ Budget must be at least $1
```

### URL Error
```
Final URL *
[not-a-url] ← Red border
❌ Please enter a valid URL
```

### Match Type Error
```
Match Types
┌────────────────────────────────────────────────┐
│ ☐ Exact Match - Precise searches only         │
│ ☐ Phrase Match - Keyword phrase in query      │
│ ☐ Broad Match - Related searches              │
└────────────────────────────────────────────────┘
❌ At least one match type must be selected
```

---

## Checkbox States

### Checked
```
☑ Daily Budget
☑ Exact Match - Precise searches only
```

### Unchecked
```
☐ Daily Budget
☐ Broad Match - Related searches
```

---

## Dropdown States

### Closed
```
Campaign Status
[Active ▼]
```

### Open
```
Campaign Status
┌─────────┐
│ Active  │ ← Highlighted
│ Paused  │
└─────────┘
```

---

## Information Banners

### Info Banner (Blue)
```
┌────────────────────────────────────────────────┐
│ ℹ Ad Content Builder                           │
│ This will create a blank ad structure. You'll  │
│ add headlines, descriptions, and other content │
│ in the Ad Builder page.                        │
└────────────────────────────────────────────────┘
```

### Settings Panel (Gray)
```
┌────────────────────────────────────────────────┐
│ Default Settings                               │
│ Final URL: https://www.example.com/summer-sale │
│ Path 1: summer                                 │
│ Path 2: sale                                   │
│                                                │
│ These values are inherited from the campaign.  │
│ You can customize them in the Ad Builder.      │
└────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (> 1024px)
- Modal width: 600-900px depending on size prop
- Two-column layout for paired fields (Budget/Status, Paths, Dates)
- Full spacing and padding

### Tablet (768px - 1024px)
- Modal width: 90% of screen
- Two-column layout maintained
- Slightly reduced padding

### Mobile (< 768px)
- Modal width: 95% of screen
- Single-column layout (stacked fields)
- Compact padding
- Touch-friendly tap targets (min 44px)

---

## Animation States

### Modal Opening
```
1. Backdrop fades in (opacity 0 → 0.5)
2. Modal scales in (scale 0.95 → 1.0)
3. Duration: 200ms
```

### Modal Closing
```
1. Modal scales out (scale 1.0 → 0.95)
2. Backdrop fades out (opacity 0.5 → 0)
3. Duration: 150ms
```

### Button Hover
```
Background color transition: 200ms ease
```

### Input Focus
```
Border color transition: 150ms ease
Ring appears: 100ms ease
```

---

## Z-Index Layers

```
Base Page:          z-index: 0
Modal Backdrop:     z-index: 50
Modal Container:    z-index: 50
```

---

## Color Scheme

### Primary (Blue)
- Primary Button: `bg-blue-600` (#2563eb)
- Primary Hover: `bg-blue-700` (#1d4ed8)
- Focus Ring: `ring-blue-500` (#3b82f6)

### Secondary (Gray)
- Secondary Button: `bg-white border-gray-300`
- Secondary Hover: `bg-gray-50`
- Input Border: `border-gray-300` (#d1d5db)
- Helper Text: `text-gray-500` (#6b7280)

### Error (Red)
- Error Border: `border-red-500` (#ef4444)
- Error Text: `text-red-600` (#dc2626)

### Success (Green)
- Not currently used in modals

### Info (Blue - lighter)
- Info Banner: `bg-blue-50 border-blue-200`
- Info Text: `text-blue-700`

---

## Typography

### Modal Title
- Font: `text-lg font-semibold`
- Color: `text-gray-900`

### Field Labels
- Font: `text-sm font-medium`
- Color: `text-gray-700`

### Input Text
- Font: `text-sm`
- Color: `text-gray-900`

### Helper Text
- Font: `text-xs`
- Color: `text-gray-500`

### Error Text
- Font: `text-xs`
- Color: `text-red-600`

### Button Text
- Font: `text-sm font-medium`
- Color: White (primary) or `text-gray-700` (secondary)

---

## Spacing

### Modal Padding
- Header: `p-6`
- Body: `p-6`
- Footer: `p-6`

### Form Spacing
- Between fields: `space-y-4`
- Between grouped fields: `gap-4`

### Button Spacing
- Between buttons: `gap-3`
- Button padding: `px-4 py-2`

---

## Border Radius

- Modal: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)
- Buttons: `rounded-lg` (8px)
- Checkboxes: `rounded` (4px)
