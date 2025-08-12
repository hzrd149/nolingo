import { db } from "@/database";
import { posts, users, pictures } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch all posts with author and picture information
    const allPosts = await db
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
      })
      .from(posts)
      .innerJoin(users, eq(posts.author, users.id))
      .innerJoin(pictures, eq(posts.picture_id, pictures.id))
      .orderBy(posts.created_at);

    // Reverse to show newest posts first
    const sortedPosts = allPosts.reverse();

    return res.status(200).json({
      posts: sortedPosts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
