/**
 * Twitter/X Publisher
 *
 * Publishes content to X (formerly Twitter) using their API v2.
 *
 * Authentication: OAuth 2.0 with PKCE (Proof Key for Code Exchange)
 * API Docs: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
 *
 * Supported features:
 * - Post tweets (up to 280 characters)
 * - Create tweet threads for longer content
 * - Add reply settings (who can reply)
 *
 * Limitations:
 * - 280 character limit per tweet (unless user has Twitter Blue/Premium)
 * - Media (images/videos) require separate upload flow (not implemented yet)
 * - Poll creation not implemented yet
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
 * Twitter API response types
 */
interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface TwitterTweet {
  id: string;
  text: string;
}

interface TwitterTweetResponse {
  data: TwitterTweet;
}

/**
 * Twitter/X Publisher Implementation
 */
export class TwitterPublisher extends BasePublisher {
  private platformConfig = getPlatformConfig("twitter")!;
  private readonly TWEET_MAX_LENGTH = 280;

  /**
   * Publish content to Twitter/X
   *
   * If content is longer than 280 characters and threadify is enabled,
   * it will be split into a thread.
   *
   * @param content - Content to publish
   * @param token - OAuth token
   * @returns Result with URL of published tweet
   */
  async publish(content: PublishableContent, token: OAuthToken | string): Promise<PublishResult> {
    try {
      // Twitter requires OAuth token
      if (typeof token === "string") {
        throw new Error("Twitter requires OAuth token, not API key");
      }

      // Build tweet text
      let tweetText = `${content.title}\n\n${content.content}`;

      // Add hashtags if provided
      if (content.tags && content.tags.length > 0) {
        const hashtags = content.tags.map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
        tweetText = `${tweetText}\n\n${hashtags}`;
      }

      // Add canonical URL if provided
      if (content.canonicalUrl) {
        tweetText = `${tweetText}\n\n${content.canonicalUrl}`;
      }

      // Check if we need to create a thread
      const shouldThreadify = content.metadata?.threadify !== false; // Default to true

      if (tweetText.length > this.TWEET_MAX_LENGTH && shouldThreadify) {
        console.log(`[Twitter] Creating thread (${tweetText.length} chars)`);
        return await this.publishThread(tweetText, token);
      } else if (tweetText.length > this.TWEET_MAX_LENGTH) {
        // Truncate if threadify is disabled
        console.warn(`[Twitter] Truncating tweet from ${tweetText.length} to ${this.TWEET_MAX_LENGTH} chars`);
        tweetText = tweetText.substring(0, this.TWEET_MAX_LENGTH - 3) + "...";
      }

      // Publish single tweet
      const tweet = await this.publishSingleTweet(tweetText, token);

      // Get username for URL construction
      const user = await this.getUserInfo(token);
      const tweetUrl = `https://twitter.com/${user.username}/status/${tweet.id}`;

      console.log(`[Twitter] Published successfully: ${tweetUrl}`);

      return {
        platformId: "twitter",
        status: PublishStatus.SUCCESS,
        url: tweetUrl,
        publishedAt: Date.now(),
      };
    } catch (error: any) {
      console.error(`[Twitter] Publish failed:`, error);

      return {
        platformId: "twitter",
        status: PublishStatus.FAILED,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Publish a single tweet
   *
   * @param text - Tweet text (max 280 chars)
   * @param token - OAuth token
   * @param replyToTweetId - ID of tweet to reply to (for threading)
   * @returns Created tweet
   */
  private async publishSingleTweet(
    text: string,
    token: OAuthToken,
    replyToTweetId?: string
  ): Promise<TwitterTweet> {
    const url = `${this.platformConfig.api.baseUrl}${this.platformConfig.api.publishEndpoint}`;

    const tweetData: any = {
      text: text,
    };

    // If replying to another tweet (for threading)
    if (replyToTweetId) {
      tweetData.reply = {
        in_reply_to_tweet_id: replyToTweetId,
      };
    }

    const response: TwitterTweetResponse = await this.makeAuthenticatedRequest(url, token, {
      method: "POST",
      body: JSON.stringify(tweetData),
    });

    return response.data;
  }

  /**
   * Publish a thread of tweets
   * Splits long content into multiple tweets and links them as replies
   *
   * @param fullText - Full text to split into thread
   * @param token - OAuth token
   * @returns Result with URL of first tweet in thread
   */
  private async publishThread(fullText: string, token: OAuthToken): Promise<PublishResult> {
    try {
      // Split text into tweet-sized chunks
      const chunks = this.splitIntoTweets(fullText);

      console.log(`[Twitter] Publishing thread of ${chunks.length} tweets`);

      let previousTweetId: string | undefined;
      let firstTweet: TwitterTweet | undefined;

      // Publish each chunk as a reply to the previous one
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const tweetNumber = `${i + 1}/${chunks.length}`;

        // Add tweet number to each tweet (except the first)
        const tweetText = i > 0 ? `${tweetNumber}\n\n${chunk}` : chunk;

        const tweet = await this.publishSingleTweet(tweetText, token, previousTweetId);

        if (i === 0) {
          firstTweet = tweet;
        }

        previousTweetId = tweet.id;

        // Small delay between tweets to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!firstTweet) {
        throw new Error("Failed to create thread");
      }

      const user = await this.getUserInfo(token);
      const threadUrl = `https://twitter.com/${user.username}/status/${firstTweet.id}`;

      console.log(`[Twitter] Thread published successfully: ${threadUrl}`);

      return {
        platformId: "twitter",
        status: PublishStatus.SUCCESS,
        url: threadUrl,
        publishedAt: Date.now(),
      };
    } catch (error: any) {
      console.error(`[Twitter] Thread publish failed:`, error);
      throw error;
    }
  }

  /**
   * Split long text into tweet-sized chunks
   * Tries to split on sentence boundaries when possible
   *
   * @param text - Full text to split
   * @returns Array of tweet texts
   */
  private splitIntoTweets(text: string): string[] {
    const chunks: string[] = [];
    let remaining = text;

    // Reserve space for tweet counter "X/Y\n\n" (approx 7 chars)
    const maxChunkLength = this.TWEET_MAX_LENGTH - 10;

    while (remaining.length > 0) {
      if (remaining.length <= maxChunkLength) {
        chunks.push(remaining);
        break;
      }

      // Try to find a good breaking point (sentence end)
      let breakPoint = maxChunkLength;

      // Look for sentence endings (. ! ?) within the limit
      const sentenceEnd = remaining.substring(0, maxChunkLength).search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        breakPoint = sentenceEnd + 1;
      } else {
        // Fall back to word boundary
        const lastSpace = remaining.substring(0, maxChunkLength).lastIndexOf(" ");
        if (lastSpace !== -1) {
          breakPoint = lastSpace;
        }
      }

      chunks.push(remaining.substring(0, breakPoint).trim());
      remaining = remaining.substring(breakPoint).trim();
    }

    return chunks;
  }

  /**
   * Validate Twitter OAuth token
   *
   * @param token - OAuth token
   * @returns true if token is valid
   */
  async validateAuth(token: OAuthToken | string): Promise<boolean> {
    try {
      if (typeof token === "string") {
        return false;
      }

      await this.getUserInfo(token);
      return true;
    } catch (error) {
      console.error(`[Twitter] Auth validation failed:`, error);
      return false;
    }
  }

  /**
   * Get Twitter user information
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
    if (typeof token === "string") {
      throw new Error("Twitter requires OAuth token");
    }

    // Get current authenticated user
    const url = `${this.platformConfig.api.baseUrl}/users/me?user.fields=profile_image_url`;

    console.log(`[Twitter] Fetching user info`);

    const response = await this.makeAuthenticatedRequest(url, token, {
      method: "GET",
    });

    const user: TwitterUser = response.data;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.profile_image_url,
    };
  }
}
