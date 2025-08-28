import { NextApiRequest, NextApiResponse } from "next";
import { detectLanguage } from "../../../lib/translation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const { text } = req.body;

    // Validate that text is provided
    if (!text || typeof text !== "string")
      return res.status(400).json({
        error: "Text is required and must be a string",
      });

    // Check if text is not empty
    if (text.trim().length === 0)
      return res.status(400).json({
        error: "Text cannot be empty",
      });

    // Detect the language using the detectLanguage function
    const result = await detectLanguage(text);

    // Return the detection results
    return res.status(200).json(result);
  } catch (error) {
    console.error("Language detection error:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("LIBRETRANSLATE_API")) {
        return res.status(500).json({
          error: "Language detection service not configured",
        });
      }
      if (error.message.includes("Language detection failed")) {
        return res.status(503).json({
          error: "Language detection service temporarily unavailable",
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      error: "Internal server error during language detection",
    });
  }
}
