import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/notification-server/push-notifications";

// Validation schema for notification preferences
const preferencesSchema = z.object({
  new_posts: z.boolean().optional(),
  post_replies: z.boolean().optional(),
  mentions: z.boolean().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = parseInt(session.user.id);

    if (req.method === "GET") {
      // Get user's notification preferences
      const preferences = await getUserNotificationPreferences(userId);

      return res.status(200).json({
        preferences,
      });
    } else if (req.method === "POST") {
      // Update user's notification preferences
      const validationResult = preferencesSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid preference data",
          details: validationResult.error,
        });
      }

      await updateUserNotificationPreferences(userId, validationResult.data);

      return res.status(200).json({
        message: "Notification preferences updated successfully",
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling notification preferences:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
