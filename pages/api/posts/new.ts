import { db } from "@/database";
import { pictures, posts } from "@/database/schema";
import { detectLanguage } from "@/lib/translate";
import { eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]";

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

    if (!userLearningLanguage) {
      return res.status(400).json({
        error: "User must have a learning language set to create posts",
      });
    }

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

    // Detect the language of the post content
    let detectedLanguage: string;
    try {
      const detection = await detectLanguage({ q: content });
      detectedLanguage = detection.language;
    } catch (error) {
      console.error("Language detection failed:", error);
      return res.status(500).json({
        error: "Failed to detect post language",
      });
    }

    // Validate that the post is in the user's learning language
    if (detectedLanguage !== userLearningLanguage) {
      return res.status(400).json({
        error: `Post must be in ${userLearningLanguage}. Detected language: ${detectedLanguage}`,
        detectedLanguage,
        expectedLanguage: userLearningLanguage,
      });
    }

    // Create the post
    const newPost = await db
      .insert(posts)
      .values({
        author: userId,
        content,
        picture_id,
        language: detectedLanguage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

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
