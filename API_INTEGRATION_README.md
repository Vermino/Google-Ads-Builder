# API Integration Documentation

## Overview

The React/Zustand frontend is now fully integrated with the SQLite-backed REST API. All campaign, ad group, and ad operations now persist to the database via API calls.

## Architecture

### Data Flow

```
React Components
    ↓
Zustand Store (useCampaignStore)
    ↓
Campaign Service (campaignService.ts)
    ↓
API Client (apiClient.ts)
    ↓
Backend REST API (http://localhost:3001)
    ↓
SQLite Database
```

### Key Files

1. **`src/services/campaignService.ts`** (NEW)
   - Handles all campaign/ad-group/ad CRUD operations
   - Transforms data between backend and frontend formats
   - Fetches nested data (campaigns with ad groups and ads)

2. **`src/stores/useCampaignStore.ts`** (MODIFIED)
   - Changed from mock data to API-driven
   - Added `loading` and `error` state
   - Added `loadCampaigns()` and `refreshCampaign()` methods
   - All CRUD methods now async and call the API

3. **`src/services/apiClient.ts`** (UNCHANGED)
   - Generic API client already supports all HTTP methods
   - Campaign endpoints use existing `request<T>()` method

4. **`src/mock-data/campaigns.ts`** (DELETED)
   - Mock data no longer needed

## Data Transformation

### Backend → Frontend

The backend stores data in separate tables with snake_case fields:

**Backend Campaign:**
```typescript
{
  id: string;
  name: string;
  budget: number;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
}
```

**Frontend Campaign:**
```typescript
{
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  budget: number;
  startDate: string;
  endDate?: string;
  location: string;
  finalUrl: string;
  path1?: string;
  path2?: string;
  globalDescriptions: GlobalDescription[];
  adGroups: AdGroup[];  // Nested!
  createdAt: string;
  updatedAt: string;
}
```

### Nested Data Fetching

The service automatically fetches nested data:

1. Fetch all campaigns from `/api/campaigns`
2. For each campaign, fetch ad groups from `/api/campaigns/:id/ad-groups`
3. For each ad group, fetch ads from `/api/ad-groups/:id/ads`
4. Transform and combine into nested structure

## Usage in Components

### Loading Campaigns

```typescript
import { useCampaignStore } from '../stores/useCampaignStore';

function CampaignsPage() {
  const { campaigns, loading, error, loadCampaigns } = useCampaignStore();

  useEffect(() => {
    loadCampaigns();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {campaigns.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
```

### Creating a Campaign

```typescript
const { addCampaign } = useCampaignStore();

async function handleCreateCampaign() {
  try {
    await addCampaign({
      id: 'new-campaign-id',
      name: 'My Campaign',
      budget: 5000,
      status: 'active',
      // ... other fields
    });
    alert('Campaign created!');
  } catch (error) {
    alert('Failed to create campaign: ' + error.message);
  }
}
```

### Updating an Ad Group

```typescript
const { updateAdGroup } = useCampaignStore();

async function handleUpdateAdGroup(campaignId, adGroupId) {
  try {
    await updateAdGroup(campaignId, adGroupId, {
      name: 'Updated Ad Group Name',
      maxCpc: 3.50,
    });
  } catch (error) {
    console.error('Update failed:', error);
  }
}
```

### Deleting Multiple Ads

```typescript
const { deleteAds } = useCampaignStore();

async function handleBulkDelete(campaignId, adGroupId, adIds) {
  try {
    await deleteAds(campaignId, adGroupId, adIds);
    alert('Ads deleted successfully!');
  } catch (error) {
    alert('Failed to delete ads: ' + error.message);
  }
}
```

## API Endpoints

### Campaigns

- `GET /api/campaigns` - Fetch all campaigns
- `GET /api/campaigns/:id` - Fetch single campaign
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/ad-groups` - Get campaign's ad groups

### Ad Groups

- `GET /api/ad-groups` - Fetch all ad groups
- `GET /api/ad-groups/:id` - Fetch single ad group
- `POST /api/ad-groups` - Create ad group
- `PUT /api/ad-groups/:id` - Update ad group
- `DELETE /api/ad-groups/:id` - Delete ad group
- `GET /api/ad-groups/:id/ads` - Get ad group's ads

### Ads

- `GET /api/ads` - Fetch all ads
- `GET /api/ads/:id` - Fetch single ad
- `POST /api/ads` - Create ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad

## Error Handling

All API operations include error handling:

1. **Network Errors**: Caught and logged to console
2. **API Errors**: Converted to user-friendly messages
3. **Store State**: `error` field contains latest error message
4. **Loading State**: `loading` tracks ongoing operations

## State Management

### Store State

```typescript
{
  campaigns: Campaign[];      // All campaigns with nested data
  loading: boolean;          // True during API operations
  error: string | null;      // Latest error message
}
```

### Local Operations

Some operations (keywords, headlines, descriptions) remain local-only for performance:

- `addKeyword()` - Updates local state only
- `updateHeadline()` - Updates local state only
- `deleteDescription()` - Updates local state only

To persist these changes, update the parent ad/ad-group/campaign.

## Testing

### Manual Testing

1. Start the backend API:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

4. Test operations:
   - View campaigns (should load from API)
   - Create a new campaign
   - Update campaign details
   - Add ad groups
   - Create ads
   - Delete items

### API Testing

Use the backend's test endpoints:

```bash
# Check API health
curl http://localhost:3001/health

# List campaigns
curl http://localhost:3001/api/campaigns

# Create campaign
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","budget":1000,"status":"active"}'
```

## Migration Notes

### Breaking Changes

1. **Store Methods Now Async**: Campaign, ad group, and ad CRUD methods now return `Promise<void>`
2. **Initial State Empty**: `campaigns` starts as `[]` instead of mock data
3. **Must Call `loadCampaigns()`**: Components must explicitly load data

### Backwards Compatibility

- Method signatures unchanged (except async)
- Return types unchanged
- Component interfaces unchanged
- Local operations (keywords, headlines) still synchronous

## Configuration

The API URL is configured via environment variables:

**`.env`**
```
VITE_API_URL=http://localhost:3001
VITE_API_TOKEN=your-optional-token
```

Default: `http://localhost:3001`

## Performance Considerations

### Nested Data Fetching

The current implementation fetches all nested data:
- 1 request for campaigns
- N requests for ad groups (one per campaign)
- M requests for ads (one per ad group)

For large datasets, consider:
1. Lazy loading ad groups/ads on demand
2. Backend endpoint to return nested data in one request
3. Pagination for campaigns list

### Caching

No caching is currently implemented. Consider adding:
- React Query for automatic caching
- Store-level cache with TTL
- Optimistic updates for better UX

## Future Improvements

1. **Batch Operations**: Create multiple entities in one request
2. **Optimistic Updates**: Update UI before API confirms
3. **Real-time Sync**: WebSocket updates for collaborative editing
4. **Offline Support**: Local storage fallback
5. **Undo/Redo**: Track operation history
6. **Data Validation**: Frontend validation before API calls

## Troubleshooting

### "Failed to load campaigns"

- Check backend is running on port 3001
- Verify database exists and has schema
- Check browser console for detailed errors

### "Campaign created but not showing"

- Call `loadCampaigns()` to refresh
- Check `loading` state isn't stuck
- Verify backend returned success response

### Keywords/Headlines Not Saving

These are local-only operations. To persist:
1. Update the keywords array on the ad group
2. Call `updateAdGroup()` to save to backend

### Slow Performance

- Check number of campaigns/ad-groups
- Enable React DevTools Profiler
- Consider lazy loading or pagination
- Add loading indicators for better UX

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend API logs
3. Test API endpoints directly with curl
4. Review data transformation logic in `campaignService.ts`
