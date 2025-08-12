import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { sendNotificationToUser } from "@/lib/notification-server/push-notifications";
import { translateText } from "@/lib/translate-utils";
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
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = session.user.id;

    // Get user's learning language
    const userInfo = await db
      .select({ learning_language: users.learning_language })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const targetLanguage = userInfo[0]?.learning_language || "en";

    try {
      // Translate test notification content to user's learning language
      const translatedTitle = await translateText(
        "🔔 Test Notification",
        targetLanguage,
        "en",
      );

      const translatedBody = await translateText(
        "This is a test notification from Nolingo! Your push notifications are working correctly.",
        targetLanguage,
        "en",
      );

      // Send a test notification to the user
      await sendNotificationToUser(userId, {
        title: translatedTitle,
        body: translatedBody,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        url: "/settings",
        data: {
          type: "test",
          url: "/settings",
        },
      });

      return res.status(200).json({
        message: "Test notification sent successfully",
      });
    } catch (translationError) {
      console.error("Failed to translate test notification:", translationError);

      // Fallback: send untranslated notification
      await sendNotificationToUser(userId, {
        title: "🔔 Test Notification",
        body: "This is a test notification from Nolingo! Your push notifications are working correctly.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        url: "/settings",
        data: {
          type: "test",
          url: "/settings",
        },
      });

      return res.status(200).json({
        message: "Test notification sent successfully (without translation)",
      });
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
