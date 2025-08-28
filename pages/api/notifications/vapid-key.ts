import { NextApiRequest, NextApiResponse } from "next";
import { getPublicVapidKey } from "@/lib/notification-server/push-notifications";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const publicKey = await getPublicVapidKey();

    return res.status(200).json({
      publicKey,
    });
  } catch (error) {
    console.error("Error getting VAPID public key:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
