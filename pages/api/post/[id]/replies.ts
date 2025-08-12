import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getRepliesWithTranslations } from "@/lib/replies";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const postId = parseInt(req.query.id as string);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Get user session to determine target language
    const session = await getServerSession(req, res, authOptions);
    const targetLanguage = session?.user?.learning_language || "en";

    // Fetch replies with translations
    const replies = await getRepliesWithTranslations(postId, targetLanguage);

    return res.status(200).json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
