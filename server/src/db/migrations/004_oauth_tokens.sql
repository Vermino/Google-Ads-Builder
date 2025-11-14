-- OAuth Token Persistence Migration
-- Stores OAuth tokens in database instead of global memory
-- Tokens survive server restarts

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  token_data TEXT NOT NULL, -- JSON stringified access/refresh tokens
  user_id TEXT, -- Reserved for future user authentication
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL, -- Token expiration (1 hour from creation)
  used INTEGER DEFAULT 0 -- 0 = not used, 1 = used (prevents reuse)
);

-- Index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires
ON oauth_tokens(expires_at);

-- Index for finding unused tokens
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_used
ON oauth_tokens(used);

-- Index for user lookup (future)
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user
ON oauth_tokens(user_id);
