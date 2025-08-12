import webpush from "web-push";
import { db } from "@/database";
import {
  vapidKeys,
  pushSubscriptions,
  notificationPreferences,
  users,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { translateText } from "@/lib/translate-utils";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
}

// Track if VAPID keys have been initialized
let vapidKeysInitialized = false;

/**
 * Initialize VAPID keys - generates new ones if they don't exist
 */
export async function initializeVapidKeys(): Promise<void> {
  if (vapidKeysInitialized) return;

  try {
    // Check if VAPID keys already exist in database
    const existingKeys = await db.select().from(vapidKeys).limit(1);

    if (existingKeys.length === 0) {
      console.log("Generating new VAPID keys...");

      // Generate new VAPID key pair
      const vapidKeyPair = webpush.generateVAPIDKeys();
      const contactEmail = process.env.VAPID_EMAIL || "admin@nolingo.app";

      // Store keys in database
      await db.insert(vapidKeys).values({
        public_key: vapidKeyPair.publicKey,
        private_key: vapidKeyPair.privateKey,
        email: contactEmail,
        created_at: new Date().toISOString(),
      });

      console.log("VAPID keys generated and stored in database");
    }

    // Load keys from database and set them for web-push
    const keys = await db.select().from(vapidKeys).limit(1);
    if (keys.length > 0) {
      const { public_key, private_key, email } = keys[0];

      webpush.setVapidDetails(`mailto:${email}`, public_key, private_key);

      vapidKeysInitialized = true;
      console.log("VAPID keys loaded and configured for web-push");
    }
  } catch (error) {
    console.error("Error initializing VAPID keys:", error);
    throw error;
  }
}

/**
 * Get the public VAPID key for client-side subscription
 */
export async function getPublicVapidKey(): Promise<string> {
  await initializeVapidKeys();

  const keys = await db
    .select({ public_key: vapidKeys.public_key })
    .from(vapidKeys)
    .limit(1);
  if (keys.length === 0) {
    throw new Error("No VAPID keys found");
  }

  return keys[0].public_key;
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribeUser(
  userId: number,
  subscription: PushSubscriptionData,
  userAgent?: string,
): Promise<void> {
  await initializeVapidKeys();

  try {
    // Remove any existing subscription for this user (users can only have one active subscription)
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId));

    // Add new subscription
    await db.insert(pushSubscriptions).values({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(`User ${userId} subscribed to push notifications`);
  } catch (error) {
    console.error("Error subscribing user to push notifications:", error);
    throw error;
  }
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeUser(userId: number): Promise<void> {
  try {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId));
    console.log(`User ${userId} unsubscribed from push notifications`);
  } catch (error) {
    console.error("Error unsubscribing user from push notifications:", error);
    throw error;
  }
}

/**
 * Send a push notification to a specific user
 */
export async function sendNotificationToUser(
  userId: number,
  payload: NotificationPayload,
): Promise<void> {
  await initializeVapidKeys();

  try {
    // Get user's push subscription
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId));

    if (subscriptions.length === 0) {
      console.log(`No push subscription found for user ${userId}`);
      return;
    }

    const subscription = subscriptions[0];
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    };

    // Send the notification
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    console.log(`Push notification sent to user ${userId}`);
  } catch (error: any) {
    console.error(`Error sending push notification to user ${userId}:`, error);

    // If the subscription is invalid, remove it from the database
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      await unsubscribeUser(userId);
      console.log(`Removed invalid subscription for user ${userId}`);
    }

    throw error;
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendNotificationToUsers(
  userIds: number[],
  payload: NotificationPayload,
): Promise<void> {
  const promises = userIds.map((userId) =>
    sendNotificationToUser(userId, payload).catch((error) => {
      console.error(`Failed to send notification to user ${userId}:`, error);
      return null; // Continue with other users even if one fails
    }),
  );

  await Promise.all(promises);
}

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: number) {
  const preferences = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.user_id, userId));

  if (preferences.length === 0) {
    // Return default preferences if none exist
    return {
      new_posts: true,
      post_replies: true,
      mentions: true,
    };
  }

  const pref = preferences[0];
  return {
    new_posts: Boolean(pref.new_posts),
    post_replies: Boolean(pref.post_replies),
    mentions: Boolean(pref.mentions),
  };
}

/**
 * Update user's notification preferences
 */
export async function updateUserNotificationPreferences(
  userId: number,
  preferences: {
    new_posts?: boolean;
    post_replies?: boolean;
    mentions?: boolean;
  },
): Promise<void> {
  const updates = {
    new_posts:
      preferences.new_posts !== undefined
        ? preferences.new_posts
          ? 1
          : 0
        : undefined,
    post_replies:
      preferences.post_replies !== undefined
        ? preferences.post_replies
          ? 1
          : 0
        : undefined,
    mentions:
      preferences.mentions !== undefined
        ? preferences.mentions
          ? 1
          : 0
        : undefined,
  };

  // Remove undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined),
  );

  try {
    // Try to update existing preferences
    const result = await db
      .update(notificationPreferences)
      .set(cleanUpdates)
      .where(eq(notificationPreferences.user_id, userId));

    // If no rows were updated, create new preferences
    if (!result) {
      await db.insert(notificationPreferences).values({
        user_id: userId,
        new_posts:
          preferences.new_posts !== undefined
            ? preferences.new_posts
              ? 1
              : 0
            : 1,
        post_replies:
          preferences.post_replies !== undefined
            ? preferences.post_replies
              ? 1
              : 0
            : 1,
        mentions:
          preferences.mentions !== undefined
            ? preferences.mentions
              ? 1
              : 0
            : 1,
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
}

/**
 * Check if user has a push subscription
 */
export async function hasUserSubscription(userId: number): Promise<boolean> {
  const subscriptions = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.user_id, userId));

  return subscriptions.length > 0;
}

// Helper function to send new post notifications
export async function sendNewPostNotification(
  postId: number,
  authorName: string,
  content: string,
  language: string,
) {
  try {
    // Get all users who have push subscriptions along with their learning language
    const allSubscribedUsers = await db
      .select({
        user_id: pushSubscriptions.user_id,
        new_posts: notificationPreferences.new_posts,
        learning_language: users.learning_language,
      })
      .from(pushSubscriptions)
      .leftJoin(
        notificationPreferences,
        eq(pushSubscriptions.user_id, notificationPreferences.user_id),
      )
      .leftJoin(users, eq(pushSubscriptions.user_id, users.id));

    // Filter users who should receive new post notifications
    // Include users who either have no preferences (default to enabled) OR have explicitly enabled new_posts
    const usersWithNotifications = allSubscribedUsers.filter(
      (user) => user.new_posts === null || user.new_posts === 1,
    );

    if (usersWithNotifications.length === 0) {
      console.log("No users subscribed to new post notifications");
      return;
    }

    // Send personalized notifications to each user in their learning language
    const notificationPromises = usersWithNotifications.map(async (user) => {
      try {
        const targetLanguage = user.learning_language || "en"; // Default to English if no learning language set

        // Translate title and body to user's learning language
        const translatedTitle = await translateText(
          `New ${language.toUpperCase()} post by ${authorName}`,
          targetLanguage,
          "en", // Assuming the template is in English
        );

        const bodyText =
          content.length > 100 ? content.substring(0, 100) + "..." : content;
        const translatedBody = await translateText(
          bodyText,
          targetLanguage,
          language,
        );

        const payload: NotificationPayload = {
          title: translatedTitle,
          body: translatedBody,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          url: `/post/${postId}`,
          data: {
            postId,
            type: "new_post",
            url: `/post/${postId}`,
          },
        };

        return sendNotificationToUser(user.user_id, payload);
      } catch (error) {
        console.error(
          `Failed to send translated notification to user ${user.user_id}:`,
          error,
        );

        // Fallback: send untranslated notification
        const payload: NotificationPayload = {
          title: `New ${language.toUpperCase()} post by ${authorName}`,
          body:
            content.length > 100 ? content.substring(0, 100) + "..." : content,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          url: `/post/${postId}`,
          data: {
            postId,
            type: "new_post",
            url: `/post/${postId}`,
          },
        };

        return sendNotificationToUser(user.user_id, payload);
      }
    });

    await Promise.all(notificationPromises);
    console.log(
      `New post notification sent to ${usersWithNotifications.length} users with translation`,
    );
  } catch (error) {
    console.error("Error sending new post notification:", error);
  }
}

// Helper function to send post reply notifications
export async function sendPostReplyNotification(
  postId: number,
  postAuthorId: number,
  replyAuthorName: string,
  replyContent: string,
  language: string,
) {
  try {
    // Check if the post author has notifications enabled for post replies
    const authorPreferences =
      await getUserNotificationPreferences(postAuthorId);

    if (!authorPreferences.post_replies) {
      console.log(
        `Post author ${postAuthorId} has reply notifications disabled`,
      );
      return;
    }

    // Check if the post author has a push subscription
    const hasSubscription = await hasUserSubscription(postAuthorId);

    if (!hasSubscription) {
      console.log(`Post author ${postAuthorId} has no push subscription`);
      return;
    }

    // Get the post author's learning language
    const authorInfo = await db
      .select({ learning_language: users.learning_language })
      .from(users)
      .where(eq(users.id, postAuthorId))
      .limit(1);

    const targetLanguage = authorInfo[0]?.learning_language || "en";

    try {
      // Translate title and body to post author's learning language
      const translatedTitle = await translateText(
        `${replyAuthorName} replied to your post`,
        targetLanguage,
        "en", // Assuming the template is in English
      );

      const bodyText =
        replyContent.length > 100
          ? replyContent.substring(0, 100) + "..."
          : replyContent;
      const translatedBody = await translateText(
        bodyText,
        targetLanguage,
        language,
      );

      const payload: NotificationPayload = {
        title: translatedTitle,
        body: translatedBody,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        url: `/post/${postId}`,
        data: {
          postId,
          type: "post_reply",
          url: `/post/${postId}`,
        },
      };

      await sendNotificationToUser(postAuthorId, payload);
      console.log(
        `Reply notification sent to post author ${postAuthorId} with translation`,
      );
    } catch (translationError) {
      console.error(
        `Failed to translate reply notification for user ${postAuthorId}:`,
        translationError,
      );

      // Fallback: send untranslated notification
      const payload: NotificationPayload = {
        title: `${replyAuthorName} replied to your post`,
        body:
          replyContent.length > 100
            ? replyContent.substring(0, 100) + "..."
            : replyContent,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        url: `/post/${postId}`,
        data: {
          postId,
          type: "post_reply",
          url: `/post/${postId}`,
        },
      };

      await sendNotificationToUser(postAuthorId, payload);
      console.log(
        `Reply notification sent to post author ${postAuthorId} without translation (fallback)`,
      );
    }
  } catch (error) {
    console.error("Error sending post reply notification:", error);
  }
}
