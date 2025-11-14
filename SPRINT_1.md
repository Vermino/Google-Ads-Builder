# Sprint 1: Foundation & Stability
**Duration:** Week 1 (Nov 14-20, 2025)
**Goal:** Polish existing features, fix critical bugs, prepare for deployment
**Status:** 🔄 In Progress

---

## 📊 Sprint Overview

| Metric | Target | Current |
|--------|--------|---------|
| **Story Points** | 40 | 0 completed |
| **Tasks** | 24 | 0 completed |
| **Bugs Fixed** | 5+ | 0 |
| **Test Coverage** | Basic E2E | None |
| **Deploy Ready** | Yes | No |

---

## 🎯 Sprint Goals

1. ✅ Fix all hardcoded API URLs (enable production deployment)
2. ✅ Persist OAuth tokens to database (survive server restart)
3. ✅ Add proper error handling and logging
4. ✅ Complete manual testing of all user flows
5. ✅ Application is production-deployable

---

## 📝 Tasks Breakdown

### 🔧 Backend Tasks (20 points)

#### 1. Fix Hardcoded API URLs → Environment Config
**Priority:** P0 | **Points:** 3 | **Owner:** [Assign]

**Current Issue:**
- Frontend has 25+ instances of hardcoded `http://localhost:3001`
- Impossible to deploy to production without manually changing URLs

**Solution:**
1. Create environment variable system for frontend
2. Replace all hardcoded URLs with config constant

**Files to Create:**
```typescript
// src/config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = {
  baseUrl: API_BASE_URL,

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};
```

**Files to Update:** (25+ files)
- src/components/automation/ScriptSetup.tsx (5 instances)
- src/components/automation/AutomationRules.tsx (3 instances)
- src/components/automation/RecommendationsList.tsx (2 instances)
- src/components/automation/ImportData.tsx (3 instances)
- src/components/campaigns/CampaignCard.tsx (1 instance)
- src/components/keywords/KeywordResearch.tsx (2 instances)
- src/components/ai/AIAdGenerator.tsx (2 instances)
- src/pages/Dashboard.tsx (2 instances)
- src/pages/Campaigns.tsx (2 instances)
- src/pages/Keywords.tsx (1 instance)
- src/pages/Automation.tsx (2 instances)

**Search Command:**
```bash
grep -r "http://localhost:3001" src/
```

**Acceptance Criteria:**
- [ ] Environment variable `VITE_API_URL` defined in .env.example
- [ ] All hardcoded URLs replaced with config import
- [ ] API calls work in both development and production
- [ ] Build succeeds without warnings

**Estimated Time:** 2-3 hours

---

#### 2. OAuth Token Persistence → Database Storage
**Priority:** P0 | **Points:** 5 | **Owner:** [Assign]

**Current Issue:**
- OAuth tokens stored in global memory: `global.tempTokens = {}`
- Tokens lost on server restart
- Users must re-authenticate after every deploy

**Solution:**
1. Create database table for OAuth tokens
2. Update routes to read/write from database
3. Add token expiration cleanup job

**Migration File:**
```sql
-- server/src/db/migrations/004_oauth_tokens.sql

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  token_data TEXT NOT NULL, -- JSON stringified tokens
  user_id TEXT, -- null for now, will be user ID later
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL, -- 1 hour from creation
  used INTEGER DEFAULT 0 -- 0 = not used, 1 = used
);

CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_used ON oauth_tokens(used);
```

**Files to Update:**
```typescript
// server/src/routes/sheets-oauth.routes.ts

import { getDatabase } from '../db/database';
import { nanoid } from 'nanoid';

// Replace global.tempTokens with database operations

// In /callback route:
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code as string);

  const db = getDatabase();
  const tokenId = nanoid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare(`
    INSERT INTO oauth_tokens (id, token_data, expires_at)
    VALUES (?, ?, ?)
  `).run(tokenId, JSON.stringify(tokens), expiresAt);

  // ... rest of callback
});

// In /create-spreadsheet route:
router.post('/create-spreadsheet', async (req, res) => {
  const { tokenId } = req.body;

  const db = getDatabase();
  const tokenRow = db.prepare(`
    SELECT token_data, expires_at, used
    FROM oauth_tokens
    WHERE id = ? AND used = 0
  `).get(tokenId);

  if (!tokenRow) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Token expired' });
  }

  const tokens = JSON.parse(tokenRow.token_data);

  // Mark token as used
  db.prepare(`UPDATE oauth_tokens SET used = 1 WHERE id = ?`).run(tokenId);

  // ... rest of create spreadsheet
});
```

**Cleanup Job:**
```typescript
// server/src/services/tokenCleanup.ts

import { getDatabase } from '../db/database';

export function cleanupExpiredTokens() {
  const db = getDatabase();

  // Delete tokens older than 2 hours
  const result = db.prepare(`
    DELETE FROM oauth_tokens
    WHERE datetime(expires_at) < datetime('now', '-2 hours')
  `).run();

  console.log(`🧹 Cleaned up ${result.changes} expired OAuth tokens`);
}

// Add to server/src/index.ts
// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
```

**Acceptance Criteria:**
- [ ] Migration creates oauth_tokens table
- [ ] Tokens persist across server restarts
- [ ] Expired tokens are cleaned up automatically
- [ ] Used tokens cannot be reused
- [ ] OAuth flow still works end-to-end

**Estimated Time:** 3-4 hours

---

#### 3. Error Logging System → Winston/Pino
**Priority:** P1 | **Points:** 3 | **Owner:** [Assign]

**Current Issue:**
- Only `console.log()` and `console.error()` for debugging
- No structured logging
- Difficult to debug production issues
- No log persistence

**Solution:**
1. Install Winston logging library
2. Configure log levels and formats
3. Add file rotation for logs
4. Update all console.* calls to use logger

**Installation:**
```bash
cd server
npm install winston winston-daily-rotate-file
npm install --save-dev @types/winston
```

**Logger Setup:**
```typescript
// server/src/utils/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
  }),
];

// Add file logging in production
if (config.nodeEnv === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports,
});

// Example usage:
// logger.info('Server started', { port: 3001 });
// logger.error('Database error', { error: err.message, stack: err.stack });
// logger.debug('Processing request', { userId: '123', action: 'create_campaign' });
```

**Usage Examples:**
```typescript
// Replace console.log
// Before:
console.log(`🚀 Server running on http://localhost:${PORT}`);

// After:
logger.info('Server started', { port: PORT, env: config.nodeEnv });

// Replace console.error
// Before:
console.error('Error running scheduled automations:', error);

// After:
logger.error('Automation scheduler error', {
  error: error.message,
  stack: error.stack
});
```

**Acceptance Criteria:**
- [ ] Winston logger configured
- [ ] All console.log replaced with logger.info
- [ ] All console.error replaced with logger.error
- [ ] Logs rotate daily
- [ ] Error logs separate from info logs
- [ ] Logs include timestamps and metadata

**Estimated Time:** 2 hours

---

#### 4. Environment Validation → Startup Checks
**Priority:** P1 | **Points:** 2 | **Owner:** [Assign]

**Current Issue:**
- App starts even with missing environment variables
- Errors only appear when features are used
- Difficult to debug configuration issues

**Solution:**
1. Enhance config validation
2. Add detailed error messages
3. Exit early if critical variables missing

**Files to Update:**
```typescript
// server/src/config/config.ts

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  if (!config.clientUrl) {
    errors.push('CLIENT_URL is required');
  }

  // Optional but recommended
  if (!config.openaiApiKey && !config.anthropicApiKey) {
    warnings.push('No AI provider configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
  }

  if (!config.googleClientId || !config.googleClientSecret) {
    warnings.push('Google OAuth not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)');
  }

  // Environment-specific
  if (config.nodeEnv === 'production') {
    if (config.clientUrl.includes('localhost')) {
      warnings.push('CLIENT_URL should not be localhost in production');
    }

    if (!config.openaiApiKey && !config.anthropicApiKey) {
      errors.push('At least one AI provider required in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Add to server/src/index.ts startup:
const validation = validateConfig();

if (!validation.valid) {
  logger.error('❌ Configuration validation failed:', { errors: validation.errors });
  process.exit(1); // Exit if critical errors
}

if (validation.warnings.length > 0) {
  logger.warn('⚠️ Configuration warnings:', { warnings: validation.warnings });
}

logger.info('✅ Configuration valid');
```

**Acceptance Criteria:**
- [ ] Critical environment variables checked on startup
- [ ] App exits with clear error if missing required vars
- [ ] Warnings shown for missing optional vars
- [ ] Production-specific validations added
- [ ] .env.example updated with all variables

**Estimated Time:** 1.5 hours

---

#### 5. Database Migrations Audit
**Priority:** P1 | **Points:** 2 | **Owner:** [Assign]

**Task:**
1. Test fresh database initialization
2. Verify all 18 tables created correctly
3. Document migration rollback procedures
4. Add migration status logging

**Test Script:**
```bash
# Delete database and test fresh init
rm server/data/campaigns.db
cd server && npm run dev

# Check migrations ran
sqlite3 server/data/campaigns.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

**Expected Tables:**
- ad_groups
- ads
- automation_executions
- automation_rules
- campaigns
- import_history
- keywords
- negative_keywords
- oauth_tokens (new)
- recommendations
- script_configs
- script_errors
- script_syncs
- search_terms
- (+ any other tables)

**Acceptance Criteria:**
- [ ] Fresh database init works without errors
- [ ] All tables created with correct schema
- [ ] Migrations logged to console
- [ ] Rollback procedure documented

**Estimated Time:** 1 hour

---

### 🎨 Frontend Tasks (15 points)

#### 6. Replace Hardcoded API URLs
**Priority:** P0 | **Points:** 5 | **Owner:** [Assign]

**Task:**
See Backend Task #1 - this is the frontend portion.

**Files to Update:**
Run search and replace in all frontend files:
```bash
cd src
grep -r "http://localhost:3001" . --include="*.tsx" --include="*.ts"
```

**Replace Pattern:**
```typescript
// Before:
const response = await fetch('http://localhost:3001/api/campaigns');

// After:
import { apiClient } from '@/config/api';
const response = await apiClient.fetch('/api/campaigns');

// Or for manual fetch:
import { API_BASE_URL } from '@/config/api';
const response = await fetch(`${API_BASE_URL}/api/campaigns`);
```

**Acceptance Criteria:**
- [ ] Zero instances of hardcoded localhost URLs
- [ ] Environment variable in .env and .env.example
- [ ] All API calls use config
- [ ] Development and production builds work

**Estimated Time:** 3 hours

---

#### 7. Loading States → Skeleton Loaders
**Priority:** P1 | **Points:** 3 | **Owner:** [Assign]

**Current Issue:**
- Blank screens while data loads
- Poor perceived performance
- No loading feedback

**Solution:**
Create skeleton loader components for major pages.

**Component to Create:**
```typescript
// src/components/ui/SkeletonLoader.tsx

interface SkeletonProps {
  variant?: 'text' | 'card' | 'list' | 'table';
  count?: number;
  className?: string;
}

export function Skeleton({ variant = 'text', count = 1, className = '' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    list: 'h-16 w-full mb-2',
    table: 'h-12 w-full mb-1',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        />
      ))}
    </>
  );
}

// Usage examples:
// <Skeleton variant="card" count={3} />
// <Skeleton variant="list" count={5} />
```

**Pages to Update:**
- src/pages/Dashboard.tsx - Show skeleton cards while loading campaigns
- src/pages/Campaigns.tsx - Show skeleton list while loading
- src/pages/Keywords.tsx - Show skeleton table while loading
- src/pages/Automation.tsx - Show skeleton for rules list

**Example Usage:**
```typescript
// src/pages/Dashboard.tsx

function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaigns() {
      setIsLoading(true);
      const data = await apiClient.fetch('/api/campaigns');
      setCampaigns(data);
      setIsLoading(false);
    }
    loadCampaigns();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <Skeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {campaigns.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Skeleton component created
- [ ] Dashboard shows skeletons while loading
- [ ] Campaigns page shows skeletons
- [ ] Keywords page shows skeletons
- [ ] Automation page shows skeletons
- [ ] Smooth transition from skeleton to content

**Estimated Time:** 2 hours

---

#### 8. Error Boundaries → Graceful Failures
**Priority:** P1 | **Points:** 2 | **Owner:** [Assign]

**Current Issue:**
- React errors crash entire app
- Users see blank white screen
- No error recovery

**Solution:**
Implement error boundary component.

**Component:**
```typescript
// src/components/ErrorBoundary.tsx

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="ml-4 text-xl font-bold text-gray-900">
                Something went wrong
              </h1>
            </div>

            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Update App.tsx:**
```typescript
// src/App.tsx

import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        {/* ... routes */}
      </Router>
    </ErrorBoundary>
  );
}
```

**Acceptance Criteria:**
- [ ] ErrorBoundary component created
- [ ] Wrapped around main App component
- [ ] Shows user-friendly error message
- [ ] Includes refresh and home buttons
- [ ] Logs errors to console
- [ ] Error details expandable

**Estimated Time:** 1.5 hours

---

#### 9. Empty States → Better UX
**Priority:** P2 | **Points:** 2 | **Owner:** [Assign]

**Current Issue:**
- Empty lists show nothing or generic "No data" message
- No clear next action for users

**Solution:**
Create empty state component with CTAs.

**Component:**
```typescript
// src/components/ui/EmptyState.tsx

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-6 max-w-sm">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**Usage Examples:**
```typescript
// src/pages/Campaigns.tsx
import { FolderOpen } from 'lucide-react';

if (campaigns.length === 0) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No campaigns yet"
      description="Create your first campaign to start managing your Google Ads"
      action={{
        label: "Create Campaign",
        onClick: () => setShowNewCampaignModal(true)
      }}
    />
  );
}

// src/pages/Keywords.tsx
import { Search } from 'lucide-react';

if (keywords.length === 0) {
  return (
    <EmptyState
      icon={Search}
      title="No keywords found"
      description="Add keywords to start tracking performance"
      action={{
        label: "Add Keywords",
        onClick: () => setShowKeywordModal(true)
      }}
    />
  );
}
```

**Pages to Update:**
- Dashboard (no campaigns)
- Campaigns (no campaigns)
- Keywords (no keywords)
- Automation (no rules)
- Recommendations (no recommendations)

**Acceptance Criteria:**
- [ ] EmptyState component created
- [ ] All list pages use empty states
- [ ] Clear CTAs for next action
- [ ] Consistent design across pages

**Estimated Time:** 1.5 hours

---

#### 10. Form Validation Enhancement
**Priority:** P2 | **Points:** 3 | **Owner:** [Assign]

**Current Issue:**
- Some forms have weak validation
- Error messages not always clear
- No real-time validation feedback

**Solution:**
Enhance form validation with react-hook-form (already installed).

**Example Enhancement:**
```typescript
// src/components/modals/NewCampaignModal.tsx

import { useForm } from 'react-hook-form';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(50, 'Campaign name must be less than 50 characters'),
  budget: z.number()
    .min(1, 'Budget must be at least $1')
    .max(1000000, 'Budget must be less than $1,000,000'),
  status: z.enum(['active', 'paused', 'draft']),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function NewCampaignModal({ isOpen, onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CampaignFormData>();

  const onSubmit = async (data: CampaignFormData) => {
    try {
      await apiClient.fetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      reset();
      onClose();
    } catch (error) {
      // Show error toast
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Campaign Name
          </label>
          <input
            {...register('name')}
            className={`w-full px-3 py-2 border rounded ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Daily Budget ($)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('budget', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded ${
              errors.budget ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.budget && (
            <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>
    </Modal>
  );
}
```

**Forms to Update:**
- NewCampaignModal
- NewAdGroupModal
- NewAdModal
- NewKeywordModal
- AutomationRuleForm

**Acceptance Criteria:**
- [ ] All forms use react-hook-form
- [ ] Validation schemas defined with Zod
- [ ] Real-time validation errors shown
- [ ] Submit button disabled while submitting
- [ ] Clear, helpful error messages

**Estimated Time:** 2.5 hours

---

### 🧪 Testing & QA (5 points)

#### 11. E2E User Flow Testing
**Priority:** P0 | **Points:** 3 | **Owner:** [Assign]

**Flows to Test:**

**Flow 1: Create Campaign → Add Keywords → Generate Ads**
- [ ] Click "New Campaign" button
- [ ] Fill in campaign name, budget, status
- [ ] Submit form successfully
- [ ] Campaign appears in list
- [ ] Click on campaign to view details
- [ ] Click "Add Ad Group"
- [ ] Add ad group successfully
- [ ] Click "Add Keywords"
- [ ] Add 5 keywords successfully
- [ ] Click "Generate Ads" (AI)
- [ ] Ads generated and saved
- [ ] Verify ads appear in list

**Flow 2: Connect Google Sheets → Generate Script → View Status**
- [ ] Navigate to Automation > Script Setup
- [ ] Click "Connect Google Sheets"
- [ ] Popup opens with Google OAuth
- [ ] Authorize app
- [ ] Popup closes automatically
- [ ] Green "Connected" status appears
- [ ] Sheet ID auto-filled
- [ ] Click "Open Google Sheet" link
- [ ] Sheet opens in new tab with correct tabs
- [ ] Enter account ID
- [ ] Click "Generate Script"
- [ ] Script appears in code block
- [ ] Click "Copy Script"
- [ ] Script copied to clipboard
- [ ] Status shows "Inactive" (no sync yet)

**Flow 3: Import CSV → Review Data → Create Automation**
- [ ] Navigate to Automation > Import Data
- [ ] Upload sample Google Ads Editor CSV
- [ ] File uploads successfully
- [ ] Import summary shows correct counts
- [ ] Click "Import"
- [ ] Campaigns/keywords imported
- [ ] Navigate to Campaigns
- [ ] Verify imported campaigns appear
- [ ] Navigate to Automation > Rules
- [ ] Click "Create Rule"
- [ ] Configure automation rule
- [ ] Save rule successfully
- [ ] Rule appears in list

**Flow 4: View Recommendations → Apply → Check History**
- [ ] Navigate to Automation > Recommendations
- [ ] Recommendations list loads
- [ ] Click on a recommendation
- [ ] Review recommendation details
- [ ] Click "Apply"
- [ ] Confirmation modal appears
- [ ] Confirm application
- [ ] Recommendation status changes to "Applied"
- [ ] Navigate to Automation > History
- [ ] Execution appears in history
- [ ] Click to view execution details

**Acceptance Criteria:**
- [ ] All 4 flows complete without errors
- [ ] Screenshots captured for each flow
- [ ] Bugs logged in GitHub Issues
- [ ] Critical bugs fixed before sprint end

**Estimated Time:** 4 hours

---

#### 12. Browser Compatibility Testing
**Priority:** P1 | **Points:** 1 | **Owner:** [Assign]

**Browsers to Test:**
- [ ] Chrome (latest) - Primary browser
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test Cases:**
- [ ] Login/logout
- [ ] Create campaign
- [ ] Open modals
- [ ] OAuth popup flow
- [ ] Copy to clipboard
- [ ] File upload
- [ ] Form submissions

**Known Issues to Watch:**
- Safari popup blocking (may need user to allow popups)
- Firefox clipboard API (may need permissions)
- Edge compatibility (should match Chrome)

**Acceptance Criteria:**
- [ ] All major features work in all browsers
- [ ] Known issues documented
- [ ] Workarounds provided where needed

**Estimated Time:** 2 hours

---

#### 13. Mobile Responsiveness Check
**Priority:** P2 | **Points:** 1 | **Owner:** [Assign]

**Breakpoints to Test:**
- [ ] 320px (small phone)
- [ ] 375px (iPhone)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1440px (desktop)

**Pages to Test:**
- [ ] Dashboard
- [ ] Campaigns list
- [ ] Campaign details
- [ ] Automation setup
- [ ] Modals

**Common Issues:**
- Tables overflow on mobile
- Modals too wide for small screens
- Buttons hard to tap (too small)
- Text too small to read

**Acceptance Criteria:**
- [ ] All pages usable on mobile
- [ ] No horizontal scroll
- [ ] Touch targets at least 44x44px
- [ ] Text readable without zooming

**Estimated Time:** 2 hours

---

## 📋 Definition of Done

A task is considered "done" when:

- [ ] Code is written and tested locally
- [ ] All acceptance criteria met
- [ ] No new TypeScript errors
- [ ] Code follows project style guide
- [ ] Console has no errors/warnings
- [ ] Feature works in Chrome, Firefox, Safari
- [ ] Feature works on mobile (basic check)
- [ ] Committed with clear commit message
- [ ] Pushed to feature branch

---

## 🚫 Blockers & Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google OAuth not set up | Medium | High | Document setup steps clearly |
| Database migration issues | Low | High | Test fresh init before deploy |
| Environment config confusion | Medium | Medium | Clear .env.example with comments |
| Mobile layout breaks | Low | Low | Test on real devices |

---

## 📊 Daily Standup Template

**Yesterday:**
- Completed: [task names]
- Blockers: [any blockers]

**Today:**
- Working on: [task names]
- Expected to complete: [task names]

**Blockers:**
- [Any new blockers or help needed]

---

## 🎉 Sprint End Checklist

Before marking sprint complete:

- [ ] All P0 tasks complete
- [ ] At least 80% of P1 tasks complete
- [ ] All E2E flows tested and working
- [ ] No critical bugs remaining
- [ ] Code pushed to main branch
- [ ] Environment variables documented
- [ ] README updated with setup instructions
- [ ] Sprint retrospective held
- [ ] Sprint 2 planned

---

## 📅 Timeline

| Day | Focus | Tasks |
|-----|-------|-------|
| **Mon** | Setup & Planning | Review tasks, assign owners, environment setup |
| **Tue** | Backend Core | Tasks 1-3 (URLs, OAuth, logging) |
| **Wed** | Backend Polish | Tasks 4-5 (validation, migrations) |
| **Thu** | Frontend Core | Tasks 6-8 (URLs, loading, errors) |
| **Fri** | Frontend Polish | Tasks 9-10 (empty states, forms) |
| **Sat** | Testing | Tasks 11-13 (E2E, browsers, mobile) |
| **Sun** | Bug Fixes | Address any issues found in testing |

---

**Sprint Start:** Monday, Nov 14
**Sprint End:** Sunday, Nov 20
**Sprint Review:** Monday, Nov 21
**Sprint Retrospective:** Monday, Nov 21
**Sprint 2 Planning:** Monday, Nov 21
