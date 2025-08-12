import { db } from "@/database";
import { posts, users, pictures, translations } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { translateText } from "./translate-utils";

export interface PostWithTranslation {
  id: number;
  content: string;
  language: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    display_name: string | null;
    picture_id: number | null;
  };
  picture: {
    id: number;
    thumbnail_url: string;
    original_url: string;
  };
  translation: {
    id: number;
    content: string;
    language: string;
  } | null;
}

/**
 * Get all posts with translations to a target language
 * If a translation doesn't exist, it will be created automatically
 */
export async function getPostsWithTranslations(
  targetLanguage: string,
): Promise<PostWithTranslation[]> {
  try {
    // Get all posts with translations using a LEFT JOIN
    // This will include posts even if they don't have translations yet
    const postsWithTranslations = await db
      .select({
        id: posts.id,
        content: posts.content,
        language: posts.language,
        created_at: posts.created_at,
        author: {
          id: users.id,
          username: users.username,
          display_name: users.display_name,
          picture_id: users.picture_id,
        },
        picture: {
          id: pictures.id,
          thumbnail_url: pictures.thumbnail_url,
          original_url: pictures.original_url,
        },
        translation: {
          id: translations.id,
          content: translations.content,
          language: translations.language,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.author, users.id))
      .innerJoin(pictures, eq(posts.picture_id, pictures.id))
      .leftJoin(
        translations,
        and(
          eq(translations.post_id, posts.id),
          eq(translations.language, targetLanguage),
        ),
      )
      .orderBy(desc(posts.created_at));

    // Use a Map to deduplicate posts by ID
    const postsMap = new Map<number, PostWithTranslation>();

    for (const post of postsWithTranslations) {
      // If we already have this post, skip it (this handles duplicate translations)
      if (postsMap.has(post.id)) {
        continue;
      }

      // If the post is already in the target language, no translation needed
      if (post.language === targetLanguage) {
        postsMap.set(post.id, {
          id: post.id,
          content: post.content,
          language: post.language,
          created_at: post.created_at,
          author: post.author,
          picture: post.picture,
          translation: null,
        });
        continue;
      }

      // If translation exists, use it
      if (post.translation?.id) {
        postsMap.set(post.id, {
          id: post.id,
          content: post.content,
          language: post.language,
          created_at: post.created_at,
          author: post.author,
          picture: post.picture,
          translation: post.translation,
        });
        continue;
      }

      // Create translation if it doesn't exist
      const newTranslation = await createTranslation(
        post.id,
        post.content,
        post.language,
        targetLanguage,
      );

      postsMap.set(post.id, {
        id: post.id,
        content: post.content,
        language: post.language,
        created_at: post.created_at,
        author: post.author,
        picture: post.picture,
        translation: newTranslation || null,
      });
    }

    // Convert Map values to array
    return Array.from(postsMap.values());
  } catch (error) {
    console.error("Error fetching posts with translations:", error);
    throw new Error("Failed to fetch posts with translations");
  }
}

/**
 * Get a single post with translation to a target language
 * If a translation doesn't exist, it will be created automatically
 */
export async function getPostWithTranslation(
  postId: number,
  targetLanguage: string,
): Promise<PostWithTranslation | null> {
  try {
    // Get the post with translation using a LEFT JOIN
    const postWithTranslation = await db
      .select({
        id: posts.id,
        content: posts.content,
        language: posts.language,
        created_at: posts.created_at,
        author: {
          id: users.id,
          username: users.username,
          display_name: users.display_name,
          picture_id: users.picture_id,
        },
        picture: {
          id: pictures.id,
          thumbnail_url: pictures.thumbnail_url,
          original_url: pictures.original_url,
        },
        translation: {
          id: translations.id,
          content: translations.content,
          language: translations.language,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.author, users.id))
      .innerJoin(pictures, eq(posts.picture_id, pictures.id))
      .leftJoin(
        translations,
        and(
          eq(translations.post_id, posts.id),
          eq(translations.language, targetLanguage),
        ),
      )
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postWithTranslation || postWithTranslation.length === 0) {
      return null;
    }

    const postData = postWithTranslation[0];

    // If the post is already in the target language, no translation needed
    if (postData.language === targetLanguage) {
      return {
        id: postData.id,
        content: postData.content,
        language: postData.language,
        created_at: postData.created_at,
        author: postData.author,
        picture: postData.picture,
        translation: null,
      };
    }

    // If translation exists, return it
    if (postData.translation?.id) {
      return {
        id: postData.id,
        content: postData.content,
        language: postData.language,
        created_at: postData.created_at,
        author: postData.author,
        picture: postData.picture,
        translation: postData.translation,
      };
    }

    // Create translation if it doesn't exist
    const newTranslation = await createTranslation(
      postId,
      postData.content,
      postData.language,
      targetLanguage,
    );

    return {
      id: postData.id,
      content: postData.content,
      language: postData.language,
      created_at: postData.created_at,
      author: postData.author,
      picture: postData.picture,
      translation: newTranslation || null,
    };
  } catch (error) {
    console.error("Error fetching post with translation:", error);
    throw new Error("Failed to fetch post with translation");
  }
}

/**
 * Create a new translation for a post
 * This is a placeholder implementation - you'll want to integrate with a real translation service
 */
async function createTranslation(
  postId: number,
  originalContent: string,
  sourceLanguage: string,
  targetLanguage: string,
) {
  // Use the existing translation service
  const translatedContent = await translateText(
    originalContent,
    targetLanguage,
    sourceLanguage,
  );

  // Insert the translation into the database
  const [newTranslation] = await db
    .insert(translations)
    .values({
      post_id: postId,
      language: targetLanguage,
      content: translatedContent,
    })
    .returning();

  return newTranslation;
}
