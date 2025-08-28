import { NextApiRequest, NextApiResponse } from "next";
import { getTranslationProvidersHealth } from "@/lib/translation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const providersHealth = await getTranslationProvidersHealth();

    // Determine which provider is active
    let activeProvider = "none";
    if (providersHealth.deepl.configured && providersHealth.deepl.healthy) {
      activeProvider = "deepl";
    } else if (providersHealth.libretranslate.healthy) {
      activeProvider = "libretranslate";
    }

    return res.status(200).json({
      activeProvider,
      providers: providersHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting translation providers status:", error);
    return res.status(500).json({
      error: "Failed to get translation providers status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
