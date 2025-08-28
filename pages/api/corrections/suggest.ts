import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTextCorrections,
  isCorrectionsServiceAvailable,
} from "../../../lib/corrections";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session to access user's learning language
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if corrections service is available
    if (!isCorrectionsServiceAvailable()) {
      return res.status(503).json({
        error: "AI corrections service is not configured on this server",
      });
    }

    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "Text is required and must be a string" });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({ error: "Text cannot be empty" });
    }

    if (text.length > 1000) {
      return res
        .status(400)
        .json({ error: "Text is too long (maximum 1000 characters)" });
    }

    // Get user's learning language from session
    const learningLanguage = session.user?.learning_language;

    // Get corrections from AI service
    const result = await getTextCorrections(text, learningLanguage);

    return res.status(200).json({
      originalText: text,
      correctedText: result.correctedText,
      explanation: result.explanation,
      learningLanguage: learningLanguage || null,
    });
  } catch (error) {
    console.error("Corrections API error:", error);

    // Pass through the error message to the frontend
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get corrections";

    return res.status(500).json({
      error: errorMessage,
    });
  }
}
