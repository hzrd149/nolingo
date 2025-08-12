import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]";
import { subscribeUser } from "@/lib/notification-server/push-notifications";

// Validation schema for push subscription
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
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

    // Validate request body
    const validationResult = subscribeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid subscription data",
        details: validationResult.error,
      });
    }

    const subscriptionData = validationResult.data;
    const userAgent = req.headers["user-agent"];

    // Subscribe user to push notifications
    await subscribeUser(userId, subscriptionData, userAgent);

    return res.status(200).json({
      message: "Successfully subscribed to push notifications",
    });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
