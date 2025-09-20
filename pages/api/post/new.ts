import { db } from "@/database";
import { pictures, posts, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]";
import { sendNewPostNotification } from "@/lib/notification-server/push-notifications";

// Validation schema for new post
const createPostSchema = z.object({
  content: z.string().min(1).max(256),
  picture_id: z.number().int().positive(),
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

    if (!userLearningLanguage)
      return res.status(400).json({
        error: "User must have a learning language set to create posts",
      });

    // Validate request body
    const validationResult = createPostSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error,
      });
    }

    const { content, picture_id } = validationResult.data;

    // Verify the picture exists and belongs to the user
    const picture = await db
      .select()
      .from(pictures)
      .where(eq(pictures.id, picture_id))
      .limit(1);

    if (picture.length === 0) {
      return res.status(404).json({ error: "Picture not found" });
    }

    if (picture[0].uploaded_by !== userId) {
      return res.status(403).json({ error: "Picture does not belong to user" });
    }

    // Use the user's learning language for the post
    const postLanguage = userLearningLanguage;

    // Create the post
    const newPost = await db
      .insert(posts)
      .values({
        author: userId,
        content,
        picture_id,
        language: postLanguage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

    // Get author information for notification
    const authorInfo = await db
      .select({
        display_name: users.display_name,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const authorName =
      authorInfo[0]?.display_name || authorInfo[0]?.username || "Unknown";

    // Send push notifications for new post (async, don't wait for completion)
    sendNewPostNotification(
      newPost[0].id,
      authorName,
      content,
      postLanguage,
    ).catch((error) => {
      console.error("Failed to send new post notification:", error);
      // Don't fail the request if notification fails
    });

    return res.status(201).json({
      message: "Post created successfully",
      post: newPost[0],
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
