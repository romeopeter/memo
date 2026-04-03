/**
 * Publishing IPC Handlers
 *
 * Handles IPC communication for publishing content to platforms.
 * These handlers coordinate between the UI and the publisher services.
 */

import { ipcMain } from "electron";
import { getTokenStore } from "../services/auth/token-store";
import { MediumPublisher } from "../services/publish/medium.publisher";
import { LinkedInPublisher } from "../services/publish/linkedin.publisher";
import { TwitterPublisher } from "../services/publish/twitter.publisher";
import { PublishableContent, PlatformId } from "../../shared/types/platform.types";

// Publisher instances
const publishers = {
  medium: new MediumPublisher(),
  linkedin: new LinkedInPublisher(),
  twitter: new TwitterPublisher(),
};

/**
 * Setup publishing IPC handlers
 */
export function setupPublishIpcHandlers() {
  /**
   * Publish content to a platform
   */
  ipcMain.handle(
    "publish:to-platform",
    async (_, platformId: PlatformId, content: PublishableContent) => {
      try {
        console.log(`[IPC] Publishing to ${platformId}: ${content.title}`);

        // Get the publisher for this platform
        const publisher = publishers[platformId];
        if (!publisher) {
          throw new Error(`No publisher available for ${platformId}`);
        }

        // Get stored token for this platform
        const tokenStore = await getTokenStore();
        const token = await tokenStore.getToken(platformId);

        if (!token) {
          throw new Error(`Not connected to ${platformId}. Please authenticate first.`);
        }

        // Publish the content
        const result = await publisher.publish(content, token);

        return result;
      } catch (error: any) {
        console.error(`[IPC] Publish failed:`, error);
        return {
          platformId: platformId,
          status: "failed",
          error: error.message,
        };
      }
    }
  );

  /**
   * Publish to multiple platforms at once
   */
  ipcMain.handle(
    "publish:to-multiple",
    async (_, platformIds: PlatformId[], content: PublishableContent) => {
      try {
        console.log(`[IPC] Publishing to ${platformIds.length} platforms`);

        // Publish to all platforms in parallel
        const results = await Promise.all(
          platformIds.map(async (platformId) => {
            const publisher = publishers[platformId];
            if (!publisher) {
              return {
                platformId: platformId,
                status: "failed",
                error: `No publisher available for ${platformId}`,
              };
            }

            const tokenStore = await getTokenStore();
            const token = await tokenStore.getToken(platformId);

            if (!token) {
              return {
                platformId: platformId,
                status: "failed",
                error: `Not connected to ${platformId}`,
              };
            }

            return await publisher.publish(content, token);
          })
        );

        return { success: true, results };
      } catch (error: any) {
        console.error(`[IPC] Multi-publish failed:`, error);
        return { success: false, error: error.message, results: [] };
      }
    }
  );

  console.log("[IPC] Publish handlers registered");
}
