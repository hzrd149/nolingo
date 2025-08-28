import { db } from "@/database";
import { replies, posts, users } from "@/database/schema";
import { detectLanguage } from "@/lib/translation";
import { eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]";
import { sendPostReplyNotification } from "@/lib/notification-server/push-notifications";

// Validation schema for new reply
const createReplySchema = z.object({
  content: z.string().min(1).max(256),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = parseInt(session.user.id);
    const userLearningLanguage = session.user.learning_language;
    const postId = parseInt(req.query.id as string);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    if (!userLearningLanguage) {
      return res.status(400).json({
        error: "User must have a learning language set to create replies",
      });
    }

    // Validate request body
    const validationResult = createReplySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error,
      });
    }

    const { content } = validationResult.data;

    // Verify the post exists
    const post = await db
      .select({
        id: posts.id,
        author: posts.author,
        language: posts.language,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Detect the language of the reply content
    let detectedLanguage: string;
    try {
      const detection = await detectLanguage(content);
      detectedLanguage = detection.language;
    } catch (error) {
      console.error("Language detection failed:", error);
      // If language detection fails, use the user's learning language as fallback
      detectedLanguage = userLearningLanguage;
    }

    // Create the reply
    const newReply = await db
      .insert(replies)
      .values({
        post_id: postId,
        author: userId,
        content,
        language: detectedLanguage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

    // Get reply author information for notification
    const replyAuthorInfo = await db
      .select({
        display_name: users.display_name,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const replyAuthorName =
      replyAuthorInfo[0]?.display_name ||
      replyAuthorInfo[0]?.username ||
      "Someone";

    // Send push notification to post author (async, don't wait for completion)
    if (post[0].author !== userId) {
      // Don't notify if replying to own post
      sendPostReplyNotification(
        postId,
        post[0].author,
        replyAuthorName,
        content,
        detectedLanguage,
      ).catch((error: any) => {
        console.error("Failed to send reply notification:", error);
        // Don't fail the request if notification fails
      });
    }

    return res.status(201).json({
      message: "Reply created successfully",
      reply: newReply[0],
    });
  } catch (error) {
    console.error("Error creating reply:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
