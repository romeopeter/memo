/**
 * OAuth Service
 *
 * Handles OAuth 2.0 authentication flows for publishing platforms.
 * Supports both standard OAuth2 and OAuth2 with PKCE (for enhanced security).
 *
 * Flow:
 * 1. User clicks "Connect to LinkedIn" in UI
 * 2. We generate authorization URL and open it in system browser
 * 3. User logs in and authorizes our app
 * 4. Platform redirects to writestream://auth/callback?code=...
 * 5. We intercept the redirect, extract the code
 * 6. We exchange code for access token
 * 7. We store token securely in database
 */

import { shell } from "electron";
import crypto from "node:crypto";
import { PlatformConfig, OAuthToken, OAuthCallbackData } from "../../../shared/types/platform.types";

/**
 * PKCE (Proof Key for Code Exchange) helper
 * Used for OAuth flows that require enhanced security (like Twitter/X)
 */
class PKCEHelper {
  /**
   * Generate a random code verifier
   * A cryptographically random string used to secure the OAuth flow
   */
  static generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  /**
   * Generate code challenge from verifier
   * The challenge is sent in the authorization request,
   * the verifier is sent when exchanging the code for a token
   */
  static generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
  }
}

/**
 * OAuth Service
 * Manages OAuth authentication for all platforms
 */
export class OAuthService {
  // Store pending OAuth flows to validate callbacks
  // Key: state parameter, Value: { platformId, codeVerifier (for PKCE) }
  private pendingFlows: Map<string, { platformId: string; codeVerifier?: string }> = new Map();

  /**
   * Start OAuth flow by opening browser
   *
   * @param platformConfig - Configuration for the platform to authenticate with
   * @returns The state parameter (used to validate the callback)
   */
  async startAuthFlow(platformConfig: PlatformConfig): Promise<string> {
    if (!platformConfig.oauth) {
      throw new Error(`Platform ${platformConfig.name} does not support OAuth`);
    }

    // Generate a random state parameter for CSRF protection
    // This prevents attackers from tricking users into authorizing malicious apps
    const state = crypto.randomBytes(16).toString("hex");

    // Prepare URL parameters
    const params = new URLSearchParams({
      client_id: platformConfig.oauth.clientId,
      redirect_uri: platformConfig.oauth.redirectUri,
      response_type: "code", // We want an authorization code
      state: state,
      scope: platformConfig.oauth.scope.join(" "), // Space-separated scopes
    });

    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    // If platform uses PKCE, generate verifier and challenge
    if (platformConfig.authType === "oauth2-pkce") {
      codeVerifier = PKCEHelper.generateCodeVerifier();
      codeChallenge = PKCEHelper.generateCodeChallenge(codeVerifier);

      params.append("code_challenge", codeChallenge);
      params.append("code_challenge_method", "S256"); // SHA-256 hashing
    }

    // Store this flow so we can validate the callback later
    this.pendingFlows.set(state, {
      platformId: platformConfig.id,
      codeVerifier,
    });

    // Build full authorization URL
    const authUrl = `${platformConfig.oauth.authUrl}?${params.toString()}`;

    console.log(`[OAuth] Starting auth flow for ${platformConfig.name}`);
    console.log(`[OAuth] Opening URL: ${authUrl}`);

    // Open the URL in user's default browser
    await shell.openExternal(authUrl);

    return state;
  }

  /**
   * Handle OAuth callback from browser redirect
   *
   * @param callbackData - Data from the redirect URL (code, state, error)
   * @param platformConfig - Configuration for the platform
   * @returns OAuth token if successful
   */
  async handleCallback(
    callbackData: OAuthCallbackData,
    platformConfig: PlatformConfig
  ): Promise<OAuthToken> {
    if (!platformConfig.oauth) {
      throw new Error(`Platform ${platformConfig.name} does not support OAuth`);
    }

    // Check for errors from the OAuth provider
    if (callbackData.error) {
      throw new Error(
        `OAuth error: ${callbackData.error} - ${callbackData.errorDescription || "Unknown error"}`
      );
    }

    // Validate state parameter (CSRF protection)
    if (!callbackData.state) {
      throw new Error("Missing state parameter in OAuth callback");
    }

    const pendingFlow = this.pendingFlows.get(callbackData.state);
    if (!pendingFlow) {
      throw new Error("Invalid or expired OAuth state");
    }

    // Validate platform matches
    if (pendingFlow.platformId !== platformConfig.id) {
      throw new Error("Platform mismatch in OAuth callback");
    }

    // We're done with this flow, remove it
    this.pendingFlows.delete(callbackData.state);

    // Exchange authorization code for access token
    if (!callbackData.code) {
      throw new Error("Missing authorization code in OAuth callback");
    }

    console.log(`[OAuth] Exchanging code for token: ${platformConfig.name}`);

    const token = await this.exchangeCodeForToken(
      callbackData.code,
      platformConfig,
      pendingFlow.codeVerifier
    );

    return token;
  }

  /**
   * Exchange authorization code for access token
   *
   * @param code - Authorization code from OAuth callback
   * @param platformConfig - Platform configuration
   * @param codeVerifier - PKCE code verifier (if using PKCE)
   * @returns OAuth token
   */
  private async exchangeCodeForToken(
    code: string,
    platformConfig: PlatformConfig,
    codeVerifier?: string
  ): Promise<OAuthToken> {
    if (!platformConfig.oauth) {
      throw new Error("Platform does not support OAuth");
    }

    // Prepare token request parameters
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: platformConfig.oauth.redirectUri,
      client_id: platformConfig.oauth.clientId,
    });

    // Add client secret if using standard OAuth2 (not PKCE)
    if (platformConfig.authType === "oauth2" && platformConfig.oauth.clientSecret) {
      params.append("client_secret", platformConfig.oauth.clientSecret);
    }

    // Add code verifier if using PKCE
    if (platformConfig.authType === "oauth2-pkce" && codeVerifier) {
      params.append("code_verifier", codeVerifier);
    }

    try {
      // Make token request to OAuth provider
      const response = await fetch(platformConfig.oauth.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();

      // Calculate token expiration time
      const now = Date.now();
      const expiresIn = tokenData.expires_in; // seconds until expiration
      const expiresAt = expiresIn ? now + expiresIn * 1000 : undefined;

      // Build OAuthToken object
      const token: OAuthToken = {
        platformId: platformConfig.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt,
        tokenType: tokenData.token_type || "Bearer",
        scope: tokenData.scope,
        createdAt: now,
        updatedAt: now,
      };

      console.log(`[OAuth] Token obtained for ${platformConfig.name}`);

      return token;
    } catch (error) {
      console.error(`[OAuth] Token exchange failed:`, error);
      throw error;
    }
  }

  /**
   * Refresh an expired access token using refresh token
   *
   * @param token - Existing token with refresh token
   * @param platformConfig - Platform configuration
   * @returns New OAuth token
   */
  async refreshToken(token: OAuthToken, platformConfig: PlatformConfig): Promise<OAuthToken> {
    if (!platformConfig.oauth) {
      throw new Error("Platform does not support OAuth");
    }

    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: platformConfig.oauth.clientId,
    });

    // Add client secret if using standard OAuth2
    if (platformConfig.authType === "oauth2" && platformConfig.oauth.clientSecret) {
      params.append("client_secret", platformConfig.oauth.clientSecret);
    }

    try {
      const response = await fetch(platformConfig.oauth.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();

      const now = Date.now();
      const expiresIn = tokenData.expires_in;
      const expiresAt = expiresIn ? now + expiresIn * 1000 : undefined;

      const newToken: OAuthToken = {
        ...token, // Keep same platformId, createdAt
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || token.refreshToken, // Keep old if not provided
        expiresAt: expiresAt,
        tokenType: tokenData.token_type || token.tokenType,
        scope: tokenData.scope || token.scope,
        updatedAt: now,
      };

      console.log(`[OAuth] Token refreshed for ${platformConfig.name}`);

      return newToken;
    } catch (error) {
      console.error(`[OAuth] Token refresh failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a token is expired or will expire soon
   *
   * @param token - Token to check
   * @param bufferSeconds - Refresh if expiring within this many seconds (default: 5 minutes)
   * @returns true if token needs refresh
   */
  isTokenExpired(token: OAuthToken, bufferSeconds: number = 300): boolean {
    if (!token.expiresAt) {
      return false; // No expiration, assume valid
    }

    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;

    return now + bufferMs >= token.expiresAt;
  }
}
