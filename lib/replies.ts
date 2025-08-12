import { db } from "@/database";
import { replies, users, replyTranslations } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { translateText } from "./translate-utils";

export interface ReplyWithTranslation {
  id: number;
  post_id: number;
  content: string;
  language: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    display_name: string | null;
    picture_id: number | null;
  };
  translation: {
    id: number;
    content: string;
    language: string;
  } | null;
}

/**
 * Get all replies for a post with translations to a target language
 * If a translation doesn't exist, it will be created automatically
 */
export async function getRepliesWithTranslations(
  postId: number,
  targetLanguage: string,
): Promise<ReplyWithTranslation[]> {
  try {
    // Get all replies for this post with translations using a LEFT JOIN
    // This will include replies even if they don't have translations yet
    const repliesWithTranslations = await db
      .select({
        id: replies.id,
        post_id: replies.post_id,
        content: replies.content,
        language: replies.language,
        created_at: replies.created_at,
        author: {
          id: users.id,
          username: users.username,
          display_name: users.display_name,
          picture_id: users.picture_id,
        },
        translation: {
          id: replyTranslations.id,
          content: replyTranslations.content,
          language: replyTranslations.language,
        },
      })
      .from(replies)
      .innerJoin(users, eq(replies.author, users.id))
      .leftJoin(
        replyTranslations,
        and(
          eq(replyTranslations.reply_id, replies.id),
          eq(replyTranslations.language, targetLanguage),
        ),
      )
      .where(eq(replies.post_id, postId))
      .orderBy(desc(replies.created_at));

    // Use a Map to deduplicate replies by ID
    const repliesMap = new Map<number, ReplyWithTranslation>();

    for (const reply of repliesWithTranslations) {
      // If we already have this reply, skip it (this handles duplicate translations)
      if (repliesMap.has(reply.id)) {
        continue;
      }

      // If the reply is already in the target language, no translation needed
      if (reply.language === targetLanguage) {
        repliesMap.set(reply.id, {
          id: reply.id,
          post_id: reply.post_id,
          content: reply.content,
          language: reply.language,
          created_at: reply.created_at,
          author: reply.author,
          translation: null,
        });
        continue;
      }

      // If translation exists, use it
      if (reply.translation?.id) {
        repliesMap.set(reply.id, {
          id: reply.id,
          post_id: reply.post_id,
          content: reply.content,
          language: reply.language,
          created_at: reply.created_at,
          author: reply.author,
          translation: reply.translation,
        });
        continue;
      }

      // Create translation if it doesn't exist
      const newTranslation = await createReplyTranslation(
        reply.id,
        reply.content,
        reply.language,
        targetLanguage,
      );

      repliesMap.set(reply.id, {
        id: reply.id,
        post_id: reply.post_id,
        content: reply.content,
        language: reply.language,
        created_at: reply.created_at,
        author: reply.author,
        translation: newTranslation || null,
      });
    }

    // Convert Map values to array and reverse to get chronological order (oldest first)
    return Array.from(repliesMap.values()).reverse();
  } catch (error) {
    console.error("Error fetching replies with translations:", error);
    throw new Error("Failed to fetch replies with translations");
  }
}

/**
 * Get a single reply with translation to a target language
 * If a translation doesn't exist, it will be created automatically
 */
export async function getReplyWithTranslation(
  replyId: number,
  targetLanguage: string,
): Promise<ReplyWithTranslation | null> {
  try {
    // Get the reply with translation using a LEFT JOIN
    const replyWithTranslation = await db
      .select({
        id: replies.id,
        post_id: replies.post_id,
        content: replies.content,
        language: replies.language,
        created_at: replies.created_at,
        author: {
          id: users.id,
          username: users.username,
          display_name: users.display_name,
          picture_id: users.picture_id,
        },
        translation: {
          id: replyTranslations.id,
          content: replyTranslations.content,
          language: replyTranslations.language,
        },
      })
      .from(replies)
      .innerJoin(users, eq(replies.author, users.id))
      .leftJoin(
        replyTranslations,
        and(
          eq(replyTranslations.reply_id, replies.id),
          eq(replyTranslations.language, targetLanguage),
        ),
      )
      .where(eq(replies.id, replyId))
      .limit(1);

    if (!replyWithTranslation || replyWithTranslation.length === 0) {
      return null;
    }

    const replyData = replyWithTranslation[0];

    // If the reply is already in the target language, no translation needed
    if (replyData.language === targetLanguage) {
      return {
        id: replyData.id,
        post_id: replyData.post_id,
        content: replyData.content,
        language: replyData.language,
        created_at: replyData.created_at,
        author: replyData.author,
        translation: null,
      };
    }

    // If translation exists, return it
    if (replyData.translation?.id) {
      return {
        id: replyData.id,
        post_id: replyData.post_id,
        content: replyData.content,
        language: replyData.language,
        created_at: replyData.created_at,
        author: replyData.author,
        translation: replyData.translation,
      };
    }

    // Create translation if it doesn't exist
    const newTranslation = await createReplyTranslation(
      replyId,
      replyData.content,
      replyData.language,
      targetLanguage,
    );

    return {
      id: replyData.id,
      post_id: replyData.post_id,
      content: replyData.content,
      language: replyData.language,
      created_at: replyData.created_at,
      author: replyData.author,
      translation: newTranslation || null,
    };
  } catch (error) {
    console.error("Error fetching reply with translation:", error);
    throw new Error("Failed to fetch reply with translation");
  }
}

/**
 * Get the count of replies for a post
 */
export async function getReplyCount(postId: number): Promise<number> {
  try {
    const result = await db
      .select({ count: replies.id })
      .from(replies)
      .where(eq(replies.post_id, postId));

    return result.length;
  } catch (error) {
    console.error("Error fetching reply count:", error);
    return 0;
  }
}

/**
 * Create a new translation for a reply
 */
async function createReplyTranslation(
  replyId: number,
  originalContent: string,
  sourceLanguage: string,
  targetLanguage: string,
) {
  try {
    // Use the existing translation service
    const translatedContent = await translateText(
      originalContent,
      targetLanguage,
      sourceLanguage,
    );

    // Insert the translation into the database
    const [newTranslation] = await db
      .insert(replyTranslations)
      .values({
        reply_id: replyId,
        language: targetLanguage,
        content: translatedContent,
      })
      .returning();

    return newTranslation;
  } catch (error) {
    console.error("Error creating reply translation:", error);
    return null;
  }
}
