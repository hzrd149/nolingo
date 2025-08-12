import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the user session
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch user profile from database
    const userProfile = await db
      .select({
        id: users.id,
        username: users.username,
        display_name: users.display_name,
        about: users.about,
        picture_id: users.picture_id,
        theme: users.theme,
        location: users.location,
        website: users.website,
        learning_language: users.learning_language,
        last_login: users.last_login,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.username, session.user.username))
      .limit(1);

    if (userProfile.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(userProfile[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
