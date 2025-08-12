import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/database";
import { pictures } from "@/database/schema";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = parseInt(session.user.id);

    // Get all pictures uploaded by the user
    const userPictures = await db
      .select({
        id: pictures.id,
        original_url: pictures.original_url,
        thumbnail_url: pictures.thumbnail_url,
        alt_text: pictures.alt_text,
        created_at: pictures.created_at,
      })
      .from(pictures)
      .where(eq(pictures.uploaded_by, userId))
      .orderBy(pictures.created_at);

    return res.status(200).json({
      pictures: userPictures,
    });

  } catch (error) {
    console.error("Error fetching user pictures:", error);
    return res.status(500).json({ 
      error: "Internal server error" 
    });
  }
} 