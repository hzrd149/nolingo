import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { getPostsWithTranslations } from "../../../lib/posts";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id)
      return res.status(401).json({ error: "Unauthorized" });

    const userLearningLanguage = session.user.learning_language;

    const posts = await getPostsWithTranslations(userLearningLanguage);
    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
