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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the user session
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { display_name, about, location, website, learning_language, theme } =
      req.body;

    // Validate required fields
    if (
      !display_name &&
      !about &&
      !location &&
      !website &&
      !learning_language &&
      !theme
    ) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided" });
    }

    // Update user in database
    const updateData: any = {};

    if (display_name !== undefined) updateData.display_name = display_name;
    if (about !== undefined) updateData.about = about;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (learning_language !== undefined)
      updateData.learning_language = learning_language;
    if (theme !== undefined) updateData.theme = theme;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.username, session.user.username));

    return res.status(200).json({
      message: "Settings updated successfully",
      updatedFields: Object.keys(updateData).filter(
        (key) => key !== "updated_at",
      ),
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
