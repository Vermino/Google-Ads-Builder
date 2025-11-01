# Modal Usage Examples

## Quick Reference Guide

### Example 1: Using NewCampaignModal in Dashboard

```tsx
import { useState } from 'react';
import { NewCampaignModal } from '@/components/modals';

const Dashboard = () => {
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsNewCampaignModalOpen(true)}>
        New Campaign
      </button>

      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
      />
    </div>
  );
};
```

**What happens when user clicks "Create Campaign":**
1. Form is validated
2. Campaign object is created with:
   - Auto-generated ID (e.g., `campaign-1730403829123`)
   - User-provided name, budget, status, etc.
   - Auto-generated createdAt/updatedAt timestamps
   - Empty adGroups and globalDescriptions arrays
3. Campaign is added to Zustand store
4. User is navigated to `/campaigns/{campaignId}`
5. Modal closes and form resets

---

### Example 2: Using NewAdGroupModal in Campaign Builder

```tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { NewAdGroupModal } from '@/components/modals';

const CampaignBuilder = () => {
  const { campaignId } = useParams();
  const [isNewAdGroupModalOpen, setIsNewAdGroupModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsNewAdGroupModalOpen(true)}>
        Add Ad Group
      </button>

      <NewAdGroupModal
        isOpen={isNewAdGroupModalOpen}
        onClose={() => setIsNewAdGroupModalOpen(false)}
        campaignId={campaignId!}
      />
    </div>
  );
};
```

**What happens when user clicks "Create Ad Group":**
1. Form is validated (name, maxCpc, at least one match type)
2. Ad Group object is created with:
   - Auto-generated ID (e.g., `adgroup-1730403829456`)
   - User-provided name, maxCpc, status
   - MatchTypeBidModifier structure based on selected match types
   - Empty keywords and ads arrays
3. Ad Group is added to the specified campaign in store
4. User is navigated to `/campaigns/{campaignId}/ad-groups/{adGroupId}`
5. Modal closes and form resets

---

### Example 3: Using NewAdModal in Ad Group Builder

```tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { NewAdModal } from '@/components/modals';

const AdGroupBuilder = () => {
  const { campaignId, adGroupId } = useParams();
  const [isNewAdModalOpen, setIsNewAdModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsNewAdModalOpen(true)}>
        Add Ad
      </button>

      <NewAdModal
        isOpen={isNewAdModalOpen}
        onClose={() => setIsNewAdModalOpen(false)}
        campaignId={campaignId!}
        adGroupId={adGroupId!}
      />
    </div>
  );
};
```

**What happens when user clicks "Create Ad":**
1. Form is validated (optional name)
2. ResponsiveSearchAd object is created with:
   - Auto-generated ID (e.g., `ad-1730403829789`)
   - User-provided name (or auto-generated from ID)
   - User-provided status
   - Inherited finalUrl, path1, path2 from campaign
   - Empty headlines and descriptions arrays
3. Ad is added to the specified ad group in store
4. User is navigated to `/campaigns/{campaignId}/ad-groups/{adGroupId}/ads/{adId}`
5. Modal closes and form resets

---

## Form Validation Examples

### NewCampaignModal Validation

**Valid Form:**
```javascript
{
  name: "Summer Sale 2024",
  budget: "100",
  location: "United States",
  finalUrl: "www.example.com/summer-sale"
}
// ✅ Creates campaign successfully
```

**Invalid Form - Missing Name:**
```javascript
{
  name: "",
  budget: "100",
  location: "United States",
  finalUrl: "www.example.com"
}
// ❌ Error: "Campaign name is required"
```

**Invalid Form - Budget Too Low:**
```javascript
{
  name: "My Campaign",
  budget: "0.50",
  location: "United States",
  finalUrl: "www.example.com"
}
// ❌ Error: "Budget must be at least $1"
```

**Invalid Form - Invalid URL:**
```javascript
{
  name: "My Campaign",
  budget: "100",
  location: "United States",
  finalUrl: "not-a-url"
}
// ❌ Error: "Please enter a valid URL"
```

---

### NewAdGroupModal Validation

**Valid Form:**
```javascript
{
  name: "Running Shoes - Exact",
  maxCpc: "1.50",
  matchTypes: {
    exact: true,
    phrase: false,
    broad: false
  }
}
// ✅ Creates ad group successfully
```

**Invalid Form - No Match Types:**
```javascript
{
  name: "My Ad Group",
  maxCpc: "1.00",
  matchTypes: {
    exact: false,
    phrase: false,
    broad: false
  }
}
// ❌ Error: "At least one match type must be selected"
```

**Invalid Form - Max CPC Too Low:**
```javascript
{
  name: "My Ad Group",
  maxCpc: "0.005",
  matchTypes: { exact: true }
}
// ❌ Error: "Max CPC must be at least $0.01"
```

---

### NewAdModal Validation

**Valid Form (with name):**
```javascript
{
  name: "Running Shoes Ad A",
  status: "enabled"
}
// ✅ Creates ad successfully
```

**Valid Form (without name):**
```javascript
{
  name: "",
  status: "enabled"
}
// ✅ Creates ad with auto-generated name like "Ad ad-1730403829789"
```

**Invalid Form - Name Too Short:**
```javascript
{
  name: "AB",
  status: "enabled"
}
// ❌ Error: "Ad name must be at least 3 characters if provided"
```

---

## Data Flow Examples

### Creating a Campaign

**User Input:**
```javascript
// User fills form with:
Campaign Name: "Summer Sale 2024"
Budget: 100
Daily Budget: checked
Location: "United States"
Status: "Active"
Final URL: "www.example.com/summer-sale"
Path 1: "summer"
Path 2: "sale"
```

**Generated Campaign Object:**
```javascript
{
  id: "campaign-1730403829123",
  name: "Summer Sale 2024",
  status: "active",
  budget: 100,
  location: "United States",
  startDate: "2024-10-31T20:30:29.123Z",
  endDate: undefined,
  finalUrl: "https://www.example.com/summer-sale",
  path1: "summer",
  path2: "sale",
  globalDescriptions: [],
  adGroups: [],
  createdAt: "2024-10-31T20:30:29.123Z",
  updatedAt: "2024-10-31T20:30:29.123Z"
}
```

**Store Action:**
```javascript
useCampaignStore.addCampaign(newCampaign)
```

**Navigation:**
```javascript
navigate('/campaigns/campaign-1730403829123')
```

---

### Creating an Ad Group

**User Input:**
```javascript
// User fills form with:
Ad Group Name: "Running Shoes - Exact"
Max CPC: 1.50
Status: "Active"
Match Types: [Exact: checked, Phrase: checked]
Exact Modifier: 10%
Phrase Modifier: -20%
```

**Generated Ad Group Object:**
```javascript
{
  id: "adgroup-1730403829456",
  campaignId: "campaign-1730403829123",
  name: "Running Shoes - Exact",
  status: "active",
  maxCpc: 1.50,
  matchTypeBidding: {
    exact: {
      enabled: true,
      percentage: 10
    },
    phrase: {
      enabled: true,
      percentage: -20
    },
    broad: {
      enabled: false,
      percentage: 0
    },
    broadModifier: {
      enabled: false,
      percentage: 0
    }
  },
  keywords: [],
  ads: [],
  createdAt: "2024-10-31T20:30:29.456Z",
  updatedAt: "2024-10-31T20:30:29.456Z"
}
```

**Store Action:**
```javascript
useCampaignStore.addAdGroup("campaign-1730403829123", newAdGroup)
```

**Navigation:**
```javascript
navigate('/campaigns/campaign-1730403829123/ad-groups/adgroup-1730403829456')
```

---

### Creating an Ad

**User Input:**
```javascript
// User fills form with:
Ad Name: "Running Shoes Ad A"
Status: "Enabled"
```

**Campaign Data (inherited):**
```javascript
{
  finalUrl: "https://www.example.com/summer-sale",
  path1: "summer",
  path2: "sale"
}
```

**Generated Ad Object:**
```javascript
{
  id: "ad-1730403829789",
  adGroupId: "adgroup-1730403829456",
  name: "Running Shoes Ad A",
  status: "enabled",
  finalUrl: "https://www.example.com/summer-sale",
  path1: "summer",
  path2: "sale",
  headlines: [],
  descriptions: [],
  createdAt: "2024-10-31T20:30:29.789Z",
  updatedAt: "2024-10-31T20:30:29.789Z"
}
```

**Store Action:**
```javascript
useCampaignStore.addAd(
  "campaign-1730403829123",
  "adgroup-1730403829456",
  newAd
)
```

**Navigation:**
```javascript
navigate('/campaigns/campaign-1730403829123/ad-groups/adgroup-1730403829456/ads/ad-1730403829789')
```

---

## Common Patterns

### Pattern 1: Modal State Management
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

// Open modal
const handleOpen = () => setIsModalOpen(true);

// Close modal
const handleClose = () => setIsModalOpen(false);

// In JSX
<button onClick={handleOpen}>Open Modal</button>
<SomeModal isOpen={isModalOpen} onClose={handleClose} />
```

### Pattern 2: Error Handling in Forms
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

// Validation function
const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!name.trim()) {
    newErrors.name = 'Name is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Clear error when user types
const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (errors[field]) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
};
```

### Pattern 3: Form Reset After Submit
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;

  // Create the entity
  addEntity(newEntity);

  // Reset form to initial state
  setFormData({
    name: '',
    status: 'active',
    // ... other fields
  });
  setErrors({});

  // Close modal and navigate
  onClose();
  navigate(\`/path/to/\${entityId}\`);
};
```

---

## Keyboard Shortcuts

All modals support:
- **ESC** - Close modal
- **Enter** - Submit form (when focused in input field)
- **Tab** - Navigate between fields
- **Click outside** - Close modal

---

## Accessibility Features

All modals include:
- ✅ Keyboard navigation support
- ✅ Focus management (focus trap within modal)
- ✅ ARIA labels on form fields
- ✅ Clear error messages with semantic HTML
- ✅ Visual feedback for invalid fields (red border)
- ✅ Helper text for complex fields
- ✅ Disabled states clearly indicated

---

## Tips for Developers

1. **Always validate before submitting**: Use the `validate()` function pattern shown above

2. **Clear errors on change**: Remove field-specific errors when the user starts typing

3. **Use TypeScript types**: Import types from `@/types` to ensure type safety

4. **Auto-generate IDs**: Use timestamp-based IDs for uniqueness

5. **Navigation after creation**: Always navigate to the newly created entity's page

6. **Reset forms**: Clear form state and errors after successful submission

7. **Inherit campaign settings**: For ads, inherit finalUrl and paths from the campaign

8. **Match type validation**: Ensure at least one match type is selected for ad groups

9. **URL validation**: Use try/catch with `new URL()` for URL validation

10. **Default values**: Provide sensible defaults (e.g., Active status, $1 budget)
