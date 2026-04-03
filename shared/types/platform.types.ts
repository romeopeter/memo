/**
 * Platform Type Definitions
 *
 * This file defines all types related to publishing platforms,
 * OAuth authentication, and publishing operations.
 */

/**
 * Supported platform identifiers
 */
export type PlatformId = "medium" | "linkedin" | "twitter" | "reddit" | "substack" | "ghost";

/**
 * OAuth authentication flow types
 */
export type AuthType =
  | "oauth2"           // Standard OAuth 2.0 authorization code flow
  | "oauth2-pkce"      // OAuth 2.0 with PKCE (for public clients like mobile/desktop)
  | "token"            // Simple token-based auth (API key)
  | "none";            // No authentication required

/**
 * OAuth token data structure
 * stored securely in encrypted SQLite database
 */
export interface OAuthToken {
  platformId: PlatformId;           // Which platform this token belongs to
  accessToken: string;              // The access token for API calls
  refreshToken?: string;            // Token to get a new access token (if supported)
  expiresAt?: number;               // Timestamp when access token expires (Unix timestamp)
  tokenType: string;                // Usually "Bearer"
  scope?: string;                   // Permissions granted
  createdAt: number;                // When this token was first obtained
  updatedAt: number;                // Last time this token was refreshed
}

/**
 * Platform configuration
 * defines how to authenticate and interact with each platform
 */
export interface PlatformConfig {
  id: PlatformId;                   // Unique identifier
  name: string;                     // Display name (e.g., "Medium")
  authType: AuthType;               // How authentication works

  // OAuth 2.0 configuration (only needed if authType is oauth2 or oauth2-pkce)
  oauth?: {
    clientId: string;               // OAuth app client ID (from platform developer settings)
    clientSecret?: string;          // OAuth app secret (not needed for PKCE)
    authUrl: string;                // Where to send user to authorize
    tokenUrl: string;               // Where to exchange code for token
    scope: string[];                // Permissions to request
    redirectUri: string;            // Where platform redirects after auth (writestream://auth/callback)
  };

  // API configuration
  api: {
    baseUrl: string;                // Base URL for API calls (e.g., "https://api.medium.com/v1")
    publishEndpoint: string;        // Endpoint to publish content
  };

  // UI display
  icon?: string;                    // Icon identifier
  color: string;                    // Brand color (hex)
  enabled: boolean;                 // Is this platform active in the app?
}

/**
 * Status of a publish operation
 */
export enum PublishStatus {
  PENDING = "pending",              // Waiting to be published
  PUBLISHING = "publishing",        // Currently being published
  SUCCESS = "success",              // Published successfully
  FAILED = "failed",                // Failed to publish
}

/**
 * Result of a publish operation
 */
export interface PublishResult {
  platformId: PlatformId;           // Which platform
  status: PublishStatus;            // Did it work?
  url?: string;                     // URL of published content (if successful)
  error?: string;                   // Error message (if failed)
  publishedAt?: number;             // Timestamp when published
}

/**
 * Content to be published
 * Generic structure that works across all platforms
 */
export interface PublishableContent {
  title: string;                    // Post title
  content: string;                  // Post body (markdown or HTML)
  tags?: string[];                  // Tags/categories
  canonicalUrl?: string;            // Original URL if cross-posting

  // Platform-specific metadata (optional)
  metadata?: {
    // Medium-specific
    publishStatus?: "public" | "draft" | "unlisted";

    // LinkedIn-specific
    visibility?: "PUBLIC" | "CONNECTIONS";

    // Twitter-specific
    threadify?: boolean;            // Break long content into thread?

    // Extensible for other platforms
    [key: string]: any;
  };
}

/**
 * OAuth callback data
 * Data returned when user completes OAuth flow in browser
 */
export interface OAuthCallbackData {
  code?: string;                    // Authorization code (for oauth2)
  state?: string;                   // CSRF protection token
  error?: string;                   // Error if authorization failed
  errorDescription?: string;        // Human-readable error
}
