# Component Migration Guide

## Overview

This guide helps you update existing components to work with the new API-integrated store.

## Key Changes

### 1. Store Initialization

**Before (Mock Data):**
```typescript
const { campaigns } = useCampaignStore();
// Campaigns were available immediately
```

**After (API-Driven):**
```typescript
const { campaigns, loading, error, loadCampaigns } = useCampaignStore();

useEffect(() => {
  loadCampaigns();
}, [loadCampaigns]);

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
```

### 2. Async Operations

**Before (Synchronous):**
```typescript
const { addCampaign } = useCampaignStore();

function handleCreate() {
  addCampaign(newCampaign);
  navigate('/campaigns');
}
```

**After (Async with Error Handling):**
```typescript
const { addCampaign } = useCampaignStore();
const [saving, setSaving] = useState(false);

async function handleCreate() {
  setSaving(true);
  try {
    await addCampaign(newCampaign);
    toast.success('Campaign created!');
    navigate('/campaigns');
  } catch (error) {
    toast.error('Failed to create campaign: ' + error.message);
  } finally {
    setSaving(false);
  }
}
```

### 3. Delete Operations

**Before:**
```typescript
function handleDelete(id) {
  if (confirm('Delete campaign?')) {
    deleteCampaign(id);
  }
}
```

**After:**
```typescript
async function handleDelete(id) {
  if (!confirm('Delete campaign?')) return;

  try {
    await deleteCampaign(id);
    toast.success('Campaign deleted!');
  } catch (error) {
    toast.error('Failed to delete: ' + error.message);
  }
}
```

### 4. Bulk Operations

**Before:**
```typescript
function handleBulkDelete(ids) {
  deleteAdGroups(campaignId, ids);
}
```

**After:**
```typescript
async function handleBulkDelete(ids) {
  const [deleting, setDeleting] = useState(false);

  setDeleting(true);
  try {
    await deleteAdGroups(campaignId, ids);
    toast.success(`Deleted ${ids.length} ad groups`);
  } catch (error) {
    toast.error('Bulk delete failed: ' + error.message);
  } finally {
    setDeleting(false);
  }
}
```

## Example Migrations

### Campaign List Component

**Before:**
```typescript
function CampaignsList() {
  const { campaigns } = useCampaignStore();

  return (
    <div>
      {campaigns.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
```

**After:**
```typescript
function CampaignsList() {
  const { campaigns, loading, error, loadCampaigns } = useCampaignStore();

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Loading campaigns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <AlertTitle>Failed to Load Campaigns</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={loadCampaigns}>Retry</Button>
      </Alert>
    );
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="No Campaigns Yet"
        description="Create your first campaign to get started"
        action={<Button onClick={() => navigate('/campaigns/new')}>Create Campaign</Button>}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {campaigns.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
```

### Campaign Form Component

**Before:**
```typescript
function CampaignForm({ initialData, onSuccess }) {
  const { addCampaign, updateCampaign } = useCampaignStore();
  const [formData, setFormData] = useState(initialData);

  function handleSubmit(e) {
    e.preventDefault();

    if (initialData?.id) {
      updateCampaign(initialData.id, formData);
    } else {
      addCampaign({ ...formData, id: generateId() });
    }

    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Save</button>
    </form>
  );
}
```

**After:**
```typescript
function CampaignForm({ initialData, onSuccess }) {
  const { addCampaign, updateCampaign } = useCampaignStore();
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (initialData?.id) {
        await updateCampaign(initialData.id, formData);
        toast.success('Campaign updated successfully!');
      } else {
        await addCampaign({ ...formData, id: generateId() });
        toast.success('Campaign created successfully!');
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Form fields */}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={saving}
          isLoading={saving}
        >
          {saving ? 'Saving...' : 'Save Campaign'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### Ad Group Manager

**Before:**
```typescript
function AdGroupManager({ campaignId }) {
  const { getCampaign, deleteAdGroup } = useCampaignStore();
  const campaign = getCampaign(campaignId);
  const [selectedIds, setSelectedIds] = useState([]);

  function handleBulkDelete() {
    if (confirm(`Delete ${selectedIds.length} ad groups?`)) {
      deleteAdGroups(campaignId, selectedIds);
      setSelectedIds([]);
    }
  }

  return (
    <div>
      <Button onClick={handleBulkDelete}>Delete Selected</Button>
      {/* Ad groups list */}
    </div>
  );
}
```

**After:**
```typescript
function AdGroupManager({ campaignId }) {
  const { getCampaign, deleteAdGroups } = useCampaignStore();
  const campaign = getCampaign(campaignId);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} ad groups?`)) return;

    setDeleting(true);
    try {
      await deleteAdGroups(campaignId, selectedIds);
      toast.success(`Deleted ${selectedIds.length} ad groups`);
      setSelectedIds([]);
    } catch (error) {
      toast.error('Failed to delete ad groups: ' + error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div>
      <Button
        onClick={handleBulkDelete}
        disabled={selectedIds.length === 0 || deleting}
        isLoading={deleting}
      >
        {deleting ? 'Deleting...' : 'Delete Selected'}
      </Button>
      {/* Ad groups list */}
    </div>
  );
}
```

## Common Patterns

### Loading States

```typescript
// Simple spinner
if (loading) return <Spinner />;

// Skeleton loaders
if (loading) return <CampaignListSkeleton />;

// Inline loading
<Button isLoading={saving}>
  {saving ? 'Saving...' : 'Save'}
</Button>
```

### Error Handling

```typescript
// Alert component
if (error) {
  return (
    <Alert variant="error">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      <Button onClick={retry}>Retry</Button>
    </Alert>
  );
}

// Toast notifications
try {
  await updateCampaign(id, data);
  toast.success('Campaign updated!');
} catch (error) {
  toast.error(error.message);
}

// Form errors
const [error, setError] = useState(null);

try {
  await saveCampaign(data);
} catch (err) {
  setError(err.message);
}

{error && <ErrorMessage>{error}</ErrorMessage>}
```

### Optimistic Updates

For better UX, update UI immediately then handle errors:

```typescript
async function handleToggleStatus(campaignId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'paused' : 'active';

  // Update UI immediately
  const optimisticUpdate = {
    status: newStatus,
  };

  // Store previous state for rollback
  const previousCampaign = getCampaign(campaignId);

  // Apply optimistic update
  set((state) => ({
    campaigns: state.campaigns.map(c =>
      c.id === campaignId ? { ...c, ...optimisticUpdate } : c
    ),
  }));

  try {
    // Confirm with backend
    await updateCampaign(campaignId, optimisticUpdate);
  } catch (error) {
    // Rollback on error
    set((state) => ({
      campaigns: state.campaigns.map(c =>
        c.id === campaignId ? previousCampaign : c
      ),
    }));
    toast.error('Failed to update status: ' + error.message);
  }
}
```

### Refresh After Updates

```typescript
async function handleUpdateAdGroup(adGroupId, updates) {
  try {
    await updateAdGroup(campaignId, adGroupId, updates);
    // Optionally refresh full campaign to get latest nested data
    await refreshCampaign(campaignId);
    toast.success('Ad group updated!');
  } catch (error) {
    toast.error('Update failed: ' + error.message);
  }
}
```

## Testing Considerations

### Unit Tests

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCampaignStore } from './useCampaignStore';

// Mock the API service
jest.mock('../services/campaignService', () => ({
  fetchCampaigns: jest.fn(() => Promise.resolve([mockCampaign])),
  createCampaign: jest.fn((campaign) => Promise.resolve(campaign)),
}));

test('loads campaigns on mount', async () => {
  const { result } = renderHook(() => useCampaignStore());

  expect(result.current.campaigns).toEqual([]);
  expect(result.current.loading).toBe(false);

  act(() => {
    result.current.loadCampaigns();
  });

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.campaigns).toHaveLength(1);
  });
});
```

### Integration Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignsList } from './CampaignsList';

test('displays campaigns and handles delete', async () => {
  render(<CampaignsList />);

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  // Verify campaign is displayed
  expect(screen.getByText('Test Campaign')).toBeInTheDocument();

  // Click delete button
  const deleteBtn = screen.getByRole('button', { name: /delete/i });
  await userEvent.click(deleteBtn);

  // Confirm dialog
  const confirmBtn = screen.getByRole('button', { name: /confirm/i });
  await userEvent.click(confirmBtn);

  // Wait for deletion
  await waitFor(() => {
    expect(screen.queryByText('Test Campaign')).not.toBeInTheDocument();
  });
});
```

## Checklist

Use this checklist when migrating components:

- [ ] Import `loading` and `error` from store
- [ ] Add `useEffect` to call `loadCampaigns()` on mount
- [ ] Handle loading state with spinner or skeleton
- [ ] Handle error state with alert or message
- [ ] Convert CRUD operations to `async`/`await`
- [ ] Add try/catch blocks for error handling
- [ ] Add loading indicators for buttons/forms
- [ ] Show success/error toasts for user feedback
- [ ] Disable buttons during operations
- [ ] Update TypeScript types if needed
- [ ] Test all CRUD operations
- [ ] Test error scenarios
- [ ] Update tests if applicable

## Need Help?

Common issues and solutions:

**"loadCampaigns is not a function"**
- Make sure you imported it from the store
- Check the store file exports it correctly

**"Cannot read property of undefined"**
- Campaign might not be loaded yet
- Add loading check: `if (!campaign) return <Spinner />;`

**"State not updating after API call"**
- Check if you're awaiting the async call
- Verify backend is returning success response
- Check browser console for errors

**"Too many re-renders"**
- Don't call `loadCampaigns()` without `useEffect`
- Add `loadCampaigns` to dependency array: `[loadCampaigns]`
