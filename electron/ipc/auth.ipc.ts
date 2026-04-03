/**
 * Authentication IPC Handlers
 *
 * Handles IPC communication for OAuth authentication flows.
 * These handlers are called from the renderer process (UI) and execute
 * in the main process where we have access to Node.js APIs.
 *
 * Flow:
 * 1. Renderer calls window.electron.auth.startOAuth("linkedin")
 * 2. This handler opens browser with OAuth URL
 * 3. User logs in and authorizes
 * 4. Browser redirects to writestream://auth/callback?code=...
 * 5. Protocol handler (in main.ts) intercepts and calls handleOAuthCallback
 * 6. We exchange code for token and store it
 */

import { ipcMain } from "electron";
import { OAuthService } from "../services/auth/oauth.service";
import { getTokenStore } from "../services/auth/token-store";
import { getPlatformConfig, platformUsesOAuth } from "../../shared/constants/platforms";
import { MediumPublisher } from "../services/publish/medium.publisher";
import { LinkedInPublisher } from "../services/publish/linkedin.publisher";
import { TwitterPublisher } from "../services/publish/twitter.publisher";
import { OAuthCallbackData, PlatformId } from "../../shared/types/platform.types";

// Service instances
const oauthService = new OAuthService();

// Publisher instances (for auth validation and user info)
const publishers = {
  medium: new MediumPublisher(),
  linkedin: new LinkedInPublisher(),
  twitter: new TwitterPublisher(),
};

/**
 * Setup authentication IPC handlers
 */
export function setupAuthIpcHandlers() {
  /**
   * Start OAuth flow for a platform
   * Opens browser with authorization URL
   */
  ipcMain.handle("auth:start-oauth", async (_, platformId: PlatformId) => {
    try {
      console.log(`[IPC] Starting OAuth for ${platformId}`);

      const platformConfig = getPlatformConfig(platformId);
      if (!platformConfig) {
        throw new Error(`Unknown platform: ${platformId}`);
      }

      // Check if platform uses OAuth
      if (!platformUsesOAuth(platformId)) {
        throw new Error(`Platform ${platformId} does not use OAuth`);
      }

      // Start the OAuth flow (opens browser)
      const state = await oauthService.startAuthFlow(platformConfig);

      return { success: true, state };
    } catch (error: any) {
      console.error(`[IPC] OAuth start failed:`, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Handle OAuth callback
   * Called by protocol handler when user completes OAuth flow
   */
  ipcMain.handle(
    "auth:handle-oauth-callback",
    async (_, platformId: PlatformId, callbackData: OAuthCallbackData) => {
      try {
        console.log(`[IPC] Handling OAuth callback for ${platformId}`);

        const platformConfig = getPlatformConfig(platformId);
        if (!platformConfig) {
          throw new Error(`Unknown platform: ${platformId}`);
        }

        // Exchange code for token
        const token = await oauthService.handleCallback(callbackData, platformConfig);

        // Store the token securely
        const tokenStore = await getTokenStore();
        await tokenStore.saveToken(token);

        console.log(`[IPC] OAuth completed successfully for ${platformId}`);

        return { success: true };
      } catch (error: any) {
        console.error(`[IPC] OAuth callback failed:`, error);
        return { success: false, error: error.message };
      }
    }
  );

  /**
   * Save token manually (for platforms like Medium that don't use OAuth)
   * User provides their API token from platform's settings
   */
  ipcMain.handle("auth:save-token", async (_, platformId: PlatformId, apiToken: string) => {
    try {
      console.log(`[IPC] Saving manual token for ${platformId}`);

      const platformConfig = getPlatformConfig(platformId);
      if (!platformConfig) {
        throw new Error(`Unknown platform: ${platformId}`);
      }

      // Validate the token works
      const publisher = publishers[platformId];
      if (!publisher) {
        throw new Error(`No publisher available for ${platformId}`);
      }

      const isValid = await publisher.validateAuth(apiToken);
      if (!isValid) {
        throw new Error("Token validation failed - token may be invalid or expired");
      }

      // Store as a simple OAuth token structure (even though it's just an API key)
      const tokenStore = await getTokenStore();
      await tokenStore.saveToken({
        platformId: platformId,
        accessToken: apiToken,
        tokenType: "Bearer",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      console.log(`[IPC] Token saved for ${platformId}`);

      return { success: true };
    } catch (error: any) {
      console.error(`[IPC] Token save failed:`, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get connected platforms
   * Returns list of platforms that have valid tokens
   */
  ipcMain.handle("auth:get-connected-platforms", async () => {
    try {
      const tokenStore = await getTokenStore();
      const tokens = await tokenStore.getAllTokens();

      // For each token, get user info
      const connectedPlatforms = await Promise.all(
        tokens.map(async (token) => {
          try {
            const publisher = publishers[token.platformId];
            if (!publisher) {
              return null;
            }

            const userInfo = await publisher.getUserInfo(token);
            const platformConfig = getPlatformConfig(token.platformId);

            return {
              platformId: token.platformId,
              platformName: platformConfig?.name || token.platformId,
              user: userInfo,
              connectedAt: token.createdAt,
            };
          } catch (error) {
            console.error(`Failed to get info for ${token.platformId}:`, error);
            return null;
          }
        })
      );

      // Filter out nulls (failed platform info fetches)
      const validPlatforms = connectedPlatforms.filter((p) => p !== null);

      return { success: true, platforms: validPlatforms };
    } catch (error: any) {
      console.error(`[IPC] Get connected platforms failed:`, error);
      return { success: false, error: error.message, platforms: [] };
    }
  });

  /**
   * Disconnect a platform
   * Removes stored token
   */
  ipcMain.handle("auth:disconnect-platform", async (_, platformId: PlatformId) => {
    try {
      console.log(`[IPC] Disconnecting ${platformId}`);

      const tokenStore = await getTokenStore();
      await tokenStore.deleteToken(platformId);

      return { success: true };
    } catch (error: any) {
      console.error(`[IPC] Disconnect failed:`, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Check if a platform is connected
   */
  ipcMain.handle("auth:is-connected", async (_, platformId: PlatformId) => {
    try {
      const tokenStore = await getTokenStore();
      const hasToken = await tokenStore.hasToken(platformId);

      return { success: true, connected: hasToken };
    } catch (error: any) {
      console.error(`[IPC] Connection check failed:`, error);
      return { success: false, connected: false };
    }
  });

  console.log("[IPC] Auth handlers registered");
}
