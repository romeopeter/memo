/**
 * LinkedIn Publisher
 *
 * Publishes content to LinkedIn using their API v2.
 *
 * Authentication: OAuth 2.0 authorization code flow
 * API Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 *
 * Supported features:
 * - Post text updates to personal profile
 * - Add hashtags (as part of the text)
 * - Set visibility (PUBLIC or CONNECTIONS)
 *
 * Limitations:
 * - Cannot post to company pages without additional permissions
 * - Maximum post length: 3000 characters
 * - Images/videos require separate upload flow (not implemented yet)
 */

import { BasePublisher } from "./publisher.interface";
import {
  PublishableContent,
  PublishResult,
  PublishStatus,
  OAuthToken,
} from "../../../shared/types/platform.types";
import { getPlatformConfig } from "../../../shared/constants/platforms";

/**
 * LinkedIn API response types
 */
interface LinkedInProfile {
  sub: string; // User ID (from OpenID Connect)
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
}

interface LinkedInUGCPost {
  id: string; // URN of the created post
}

/**
 * LinkedIn Publisher Implementation
 */
export class LinkedInPublisher extends BasePublisher {
  private platformConfig = getPlatformConfig("linkedin")!;
  private userUrn: string | null = null; // Cached user URN

  /**
   * Publish content to LinkedIn
   *
   * @param content - Content to publish
   * @param token - OAuth token
   * @returns Result with URL of published post
   */
  async publish(content: PublishableContent, token: OAuthToken | string): Promise<PublishResult> {
    try {
      // LinkedIn requires OAuth token, not API key
      if (typeof token === "string") {
        throw new Error("LinkedIn requires OAuth token, not API key");
      }

      // Ensure we have the user URN
      if (!this.userUrn) {
        const user = await this.getUserInfo(token);
        this.userUrn = `urn:li:person:${user.id}`;
      }

      // Get visibility setting from metadata (default: PUBLIC)
      const visibility = content.metadata?.visibility || "PUBLIC";

      // Build post text
      // If tags are provided, append them as hashtags
      let postText = content.content;
      if (content.tags && content.tags.length > 0) {
        const hashtags = content.tags.map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
        postText = `${postText}\n\n${hashtags}`;
      }

      // LinkedIn has a 3000 character limit for posts
      if (postText.length > 3000) {
        console.warn(`[LinkedIn] Post truncated from ${postText.length} to 3000 characters`);
        postText = postText.substring(0, 2997) + "...";
      }

      // Prepare UGC (User Generated Content) post data
      // See: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
      const postData = {
        author: this.userUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: "NONE", // Text-only post (no images/videos)
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": visibility, // PUBLIC or CONNECTIONS
        },
      };

      const url = `${this.platformConfig.api.baseUrl}${this.platformConfig.api.publishEndpoint}`;

      console.log(`[LinkedIn] Publishing post (${postText.length} chars)`);

      // Make the API request
      const response = await this.makeAuthenticatedRequest(url, token, {
        method: "POST",
        body: JSON.stringify(postData),
        headers: {
          "X-Restli-Protocol-Version": "2.0.0", // Required by LinkedIn API
        },
      });

      const post: LinkedInUGCPost = response;

      // Extract post ID from URN (format: urn:li:share:1234567890)
      const postId = post.id.split(":").pop();

      // LinkedIn doesn't return the post URL directly, we construct it
      // Format: https://www.linkedin.com/feed/update/urn:li:share:1234567890
      const postUrl = `https://www.linkedin.com/feed/update/${post.id}`;

      console.log(`[LinkedIn] Published successfully: ${postUrl}`);

      return {
        platformId: "linkedin",
        status: PublishStatus.SUCCESS,
        url: postUrl,
        publishedAt: Date.now(),
      };
    } catch (error: any) {
      console.error(`[LinkedIn] Publish failed:`, error);

      return {
        platformId: "linkedin",
        status: PublishStatus.FAILED,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Validate LinkedIn OAuth token
   *
   * @param token - OAuth token
   * @returns true if token is valid
   */
  async validateAuth(token: OAuthToken | string): Promise<boolean> {
    try {
      // LinkedIn requires OAuth token
      if (typeof token === "string") {
        return false;
      }

      // Try to get user info - if it works, token is valid
      await this.getUserInfo(token);
      return true;
    } catch (error) {
      console.error(`[LinkedIn] Auth validation failed:`, error);
      return false;
    }
  }

  /**
   * Get LinkedIn user information
   * Uses OpenID Connect userinfo endpoint
   *
   * @param token - OAuth token
   * @returns User info
   */
  async getUserInfo(token: OAuthToken | string): Promise<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  }> {
    // LinkedIn requires OAuth token
    if (typeof token === "string") {
      throw new Error("LinkedIn requires OAuth token");
    }

    // Use OpenID Connect userinfo endpoint
    const url = "https://api.linkedin.com/v2/userinfo";

    console.log(`[LinkedIn] Fetching user info`);

    const response: LinkedInProfile = await this.makeAuthenticatedRequest(url, token, {
      method: "GET",
    });

    // Cache user URN for publishing
    this.userUrn = `urn:li:person:${response.sub}`;

    return {
      id: response.sub,
      name: response.name,
      username: undefined, // LinkedIn doesn't expose username in basic profile
      avatarUrl: response.picture,
    };
  }
}
