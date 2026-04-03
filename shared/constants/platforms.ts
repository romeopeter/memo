/**
 * Platform Registry
 *
 * Central configuration for all supported publishing platforms.
 * Each platform defines its OAuth settings, API endpoints, and UI metadata.
 *
 * IMPORTANT: Replace placeholder CLIENT_ID and CLIENT_SECRET values with real
 * credentials from each platform's developer portal:
 * - Medium: https://medium.com/me/applications
 * - LinkedIn: https://www.linkedin.com/developers/apps
 * - Twitter/X: https://developer.twitter.com/en/portal/dashboard
 */

import { PlatformConfig } from "../types/platform.types";

/**
 * Custom protocol for OAuth redirects
 * This must be registered with the OS (handled in electron/main.ts)
 */
export const OAUTH_REDIRECT_URI = "writestream://auth/callback";

/**
 * Platform configurations
 * To add a new platform:
 * 1. Add the platform ID to PlatformId type in platform.types.ts
 * 2. Create a new PlatformConfig entry below
 * 3. Implement a publisher service in electron/services/publish/<platform>.publisher.ts
 * 4. Register the publisher in the publish IPC handler
 */
export const PLATFORMS: Record<string, PlatformConfig> = {
  /**
   * MEDIUM
   * Note: Medium uses simple token-based auth, NOT OAuth2
   * Users get their integration token from https://medium.com/me/settings/security
   */
  medium: {
    id: "medium",
    name: "Medium",
    authType: "token", // Medium doesn't use OAuth, just a self-issued integration token

    // No OAuth config needed for Medium
    oauth: undefined,

    api: {
      baseUrl: "https://api.medium.com/v1",
      publishEndpoint: "/users/{{userId}}/posts", // {{userId}} will be replaced at runtime
    },

    color: "#00ab6c",
    enabled: true,
  },

  /**
   * LINKEDIN
   * OAuth 2.0 with authorization code flow
   * Docs: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
   */
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    authType: "oauth2",

    oauth: {
      // TODO: Replace with real credentials from https://www.linkedin.com/developers/apps
      clientId: process.env.LINKEDIN_CLIENT_ID || "YOUR_LINKEDIN_CLIENT_ID",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "YOUR_LINKEDIN_CLIENT_SECRET",

      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",

      // Scopes for posting content
      // See: https://learn.microsoft.com/en-us/linkedin/shared/references/v2/posts
      scope: ["openid", "profile", "email", "w_member_social"],

      redirectUri: OAUTH_REDIRECT_URI,
    },

    api: {
      baseUrl: "https://api.linkedin.com/v2",
      publishEndpoint: "/ugcPosts", // LinkedIn's unified publishing API
    },

    color: "#0077b5",
    enabled: true,
  },

  /**
   * TWITTER / X
   * OAuth 2.0 with PKCE (Proof Key for Code Exchange)
   * PKCE doesn't require client secret, more secure for desktop apps
   * Docs: https://developer.twitter.com/en/docs/authentication/oauth-2-0
   */
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    authType: "oauth2-pkce",

    oauth: {
      // TODO: Replace with real credentials from https://developer.twitter.com/en/portal/dashboard
      clientId: process.env.TWITTER_CLIENT_ID || "YOUR_TWITTER_CLIENT_ID",
      // No client secret for PKCE
      clientSecret: undefined,

      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",

      // Scopes for posting tweets
      // See: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],

      redirectUri: OAUTH_REDIRECT_URI,
    },

    api: {
      baseUrl: "https://api.twitter.com/2",
      publishEndpoint: "/tweets", // Twitter API v2 tweets endpoint
    },

    color: "#1da1f2",
    enabled: true,
  },

  /**
   * REDDIT (Example for future implementation)
   * Disabled by default - uncomment and configure when ready
   */
  /*
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
    enabled: false, // Disabled until implemented
  },
  */
};

/**
 * Get configuration for a specific platform
 */
export function getPlatformConfig(platformId: string): PlatformConfig | undefined {
  return PLATFORMS[platformId];
}

/**
 * Get all enabled platforms
 */
export function getEnabledPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORMS).filter((platform) => platform.enabled);
}

/**
 * Check if a platform uses OAuth
 */
export function platformUsesOAuth(platformId: string): boolean {
  const platform = getPlatformConfig(platformId);
  return platform?.authType === "oauth2" || platform?.authType === "oauth2-pkce";
}
