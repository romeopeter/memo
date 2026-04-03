# OAuth Setup Guide

This guide explains how to set up OAuth authentication for Writestream's publishing platforms.

## Architecture Overview

Writestream uses a **pluggable OAuth system** that makes it easy to add new publishing platforms. Here's how it works:

### 1. Type Definitions (`shared/types/platform.types.ts`)
- Defines all platform-related types (PlatformId, PlatformConfig, OAuthToken, etc.)
- Shared between main process and renderer process

### 2. Platform Registry (`shared/constants/platforms.ts`)
- Central configuration for all platforms
- Contains OAuth URLs, API endpoints, client IDs (with placeholders)
- **To add a new platform**: Add entry to the `PLATFORMS` object

### 3. OAuth Service (`electron/services/auth/oauth.service.ts`)
- Handles OAuth 2.0 flows (standard and PKCE)
- Opens browser for authentication
- Exchanges authorization code for access token
- Refreshes expired tokens

### 4. Token Storage (`electron/services/auth/token-store.ts`)
- Securely stores tokens in encrypted SQLite database
- Uses AES-256-GCM encryption
- **Note**: Requires `better-sqlite3` package (currently mocked)

### 5. Publisher Interface (`electron/services/publish/publisher.interface.ts`)
- Abstract base class for all publishers
- Defines methods: `publish()`, `validateAuth()`, `getUserInfo()`
- **To add a new platform**: Extend `BasePublisher`

### 6. Platform Publishers
- `medium.publisher.ts` - Token-based authentication
- `linkedin.publisher.ts` - OAuth 2.0
- `twitter.publisher.ts` - OAuth 2.0 with PKCE

### 7. IPC Communication
- `auth.ipc.ts` - Authentication handlers
- `publish.ipc.ts` - Publishing handlers
- Exposed to renderer via `electron/preload.ts`

---

## Setting Up Platforms

### Prerequisites

1. **Install better-sqlite3** (for token storage):
   ```bash
   npm install better-sqlite3
   npm install --save-dev @types/better-sqlite3
   ```

2. **Uncomment database code** in `electron/services/auth/token-store.ts`:
   - Remove `// TODO: Uncomment when better-sqlite3 is installed` comments
   - Uncomment all database-related code

3. **Create `.env` file** in project root (copy from `.env.example` if exists):
   ```bash
   # Medium (no OAuth - users provide their own integration token)
   # Get from: https://medium.com/me/settings/security

   # LinkedIn OAuth
   LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here

   # Twitter/X OAuth (PKCE - no secret needed)
   TWITTER_CLIENT_ID=your_client_id_here
   ```

---

## Getting OAuth Credentials

### Medium (Token-Based Auth)

Medium uses self-issued integration tokens instead of OAuth:

1. User goes to https://medium.com/me/settings/security
2. User generates an integration token
3. User pastes token into Writestream UI
4. Writestream validates and stores it

**In UI**: Call `window.electron.auth.saveToken("medium", token)`

---

### LinkedIn (OAuth 2.0)

1. **Create LinkedIn App**:
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create app"
   - Fill in app details (name, logo, etc.)
   - Select "Sign In with LinkedIn using OpenID Connect" product

2. **Configure OAuth Settings**:
   - Redirect URLs: `writestream://auth/callback`
   - Scopes: `openid`, `profile`, `email`, `w_member_social`

3. **Get Credentials**:
   - Go to "Auth" tab
   - Copy "Client ID" and "Client Secret"
   - Add to `.env` file

4. **Test**:
   ```javascript
   // In renderer
   await window.electron.auth.startOAuth("linkedin");
   // Browser opens, user logs in
   // Callback is handled automatically
   ```

---

### Twitter/X (OAuth 2.0 with PKCE)

1. **Create Twitter App**:
   - Go to https://developer.twitter.com/en/portal/dashboard
   - Click "Create Project" and "Create App"
   - Enable OAuth 2.0

2. **Configure OAuth Settings**:
   - App permissions: "Read and write"
   - Type of App: "Native App" (for PKCE)
   - Redirect URI: `writestream://auth/callback`
   - Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`

3. **Get Credentials**:
   - Go to "Keys and tokens" tab
   - Copy "Client ID" (no secret needed for PKCE)
   - Add to `.env` file

4. **Test**:
   ```javascript
   await window.electron.auth.startOAuth("twitter");
   ```

---

## Adding a New Platform (e.g., Reddit)

Follow these steps to add Reddit or any other platform:

### Step 1: Add Type Definition

In `shared/types/platform.types.ts`:
```typescript
export type PlatformId = "medium" | "linkedin" | "twitter" | "reddit";
```

### Step 2: Add Platform Config

In `shared/constants/platforms.ts`, uncomment the Reddit section or add new:
```typescript
reddit: {
  id: "reddit",
  name: "Reddit",
  authType: "oauth2",
  oauth: {
    clientId: process.env.REDDIT_CLIENT_ID || "YOUR_REDDIT_CLIENT_ID",
    clientSecret: process.env.REDDIT_CLIENT_SECRET || "YOUR_REDDIT_CLIENT_SECRET",
    authUrl: "https://www.reddit.com/api/v1/authorize",
    tokenUrl: "https://www.reddit.com/api/v1/access_token",
    scope: ["identity", "submit"],
    redirectUri: OAUTH_REDIRECT_URI,
  },
  api: {
    baseUrl: "https://oauth.reddit.com",
    publishEndpoint: "/api/submit",
  },
  color: "#ff4500",
  enabled: true,
},
```

### Step 3: Create Publisher

Create `electron/services/publish/reddit.publisher.ts`:

```typescript
import { BasePublisher } from "./publisher.interface";
import {
  PublishableContent,
  PublishResult,
  PublishStatus,
  OAuthToken,
} from "../../../shared/types/platform.types";
import { getPlatformConfig } from "../../../shared/constants/platforms";

export class RedditPublisher extends BasePublisher {
  private platformConfig = getPlatformConfig("reddit")!;

  async publish(content: PublishableContent, token: OAuthToken | string): Promise<PublishResult> {
    // 1. Validate token is OAuth (not string)
    // 2. Prepare post data according to Reddit API
    // 3. Make API request
    // 4. Return result with URL or error
  }

  async validateAuth(token: OAuthToken | string): Promise<boolean> {
    // Try to get user info - if it works, token is valid
  }

  async getUserInfo(token: OAuthToken | string): Promise<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  }> {
    // Call Reddit's /api/v1/me endpoint
  }
}
```

### Step 4: Register Publisher

In `electron/ipc/auth.ipc.ts` and `electron/ipc/publish.ipc.ts`, add:
```typescript
import { RedditPublisher } from "../services/publish/reddit.publisher";

const publishers = {
  medium: new MediumPublisher(),
  linkedin: new LinkedInPublisher(),
  twitter: new TwitterPublisher(),
  reddit: new RedditPublisher(), // Add this
};
```

### Step 5: Test

```javascript
// In renderer
await window.electron.auth.startOAuth("reddit");
```

---

## Usage in Renderer (React)

### Check Connection Status

```typescript
const { success, connected } = await window.electron.auth.isConnected("linkedin");
```

### Connect to Platform (OAuth)

```typescript
// Start OAuth flow
const { success } = await window.electron.auth.startOAuth("linkedin");

// Listen for callback (optional - handled automatically)
window.electron.auth.onOAuthCallback((event, data) => {
  console.log("OAuth completed!", data);
});
```

### Connect to Platform (Token)

```typescript
// For Medium
const token = "user's integration token from Medium";
const { success, error } = await window.electron.auth.saveToken("medium", token);
```

### Publish Content

```typescript
const content = {
  title: "My First Post",
  content: "This is the content of my post...",
  tags: ["writing", "blogging"],
  canonicalUrl: "https://myblog.com/my-first-post",
  metadata: {
    publishStatus: "public", // Medium
    visibility: "PUBLIC",    // LinkedIn
    threadify: true,          // Twitter
  },
};

// Publish to one platform
const result = await window.electron.publish.toPlatform("linkedin", content);
console.log(result.url); // URL of published post

// Publish to multiple platforms
const { results } = await window.electron.publish.toMultiple(
  ["medium", "linkedin", "twitter"],
  content
);
```

### Get Connected Platforms

```typescript
const { platforms } = await window.electron.auth.getConnectedPlatforms();

platforms.forEach(platform => {
  console.log(`${platform.platformName}: @${platform.user.username}`);
});
```

### Disconnect Platform

```typescript
await window.electron.auth.disconnectPlatform("linkedin");
```

---

## Security Notes

1. **Token Encryption**: All tokens are encrypted using AES-256-GCM before storage
2. **Encryption Key**: Stored separately with restricted file permissions (0o600)
3. **No Secrets in Code**: All API credentials should be in `.env`, never hardcoded
4. **PKCE for Desktop**: Twitter uses PKCE (no client secret) for enhanced security
5. **Custom Protocol**: `writestream://` must be registered with the OS (handled in main.ts)

---

## Troubleshooting

### OAuth callback not working

- Check that `writestream://` protocol is registered (see `electron/main.ts`)
- Verify redirect URI in platform settings matches `writestream://auth/callback`
- Check browser console for errors

### Token validation fails

- Ensure API credentials are correct in `.env`
- Check that required scopes are granted
- Verify token hasn't expired (refresh tokens handle this automatically)

### Database errors

- Install `better-sqlite3`: `npm install better-sqlite3`
- Uncomment database code in `token-store.ts`
- Check file permissions on `~/.config/writestream/tokens.db`

---

## API Reference

All APIs are available via `window.electron` in the renderer process.

See TypeScript type definitions in:
- `shared/types/platform.types.ts` - Platform types
- `shared/types/app-types.d.ts` - Window.electron interface
