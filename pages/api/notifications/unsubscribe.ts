import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { unsubscribeUser } from "@/lib/notification-server/push-notifications";

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

    // Unsubscribe user from push notifications
    await unsubscribeUser(userId);

    return res.status(200).json({
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
