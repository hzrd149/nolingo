import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getReplyWithTranslation } from "@/lib/replies";
import { generateTTSWithLanguage, TTSError } from "@/lib/tts";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const replyId = parseInt(req.query.id as string);

    if (isNaN(replyId)) {
      return res.status(400).json({ error: "Invalid reply ID" });
    }

    // Get user session to determine target language for translation
    const session = await getServerSession(req, res, authOptions);
    const targetLanguage =
      req.query.lang || session?.user?.learning_language || "en";
    const provider = req.query.provider as "piper" | "kokoro" | undefined;

    // Fetch reply with translation
    const reply = await getReplyWithTranslation(replyId, targetLanguage);

    if (!reply) return res.status(404).json({ error: "Reply not found" });

    // Determine what text to synthesize - prefer translated content
    const textToSynthesize = reply.translation?.content || reply.content;

    if (!textToSynthesize)
      return res.status(400).json({ error: "No content to synthesize" });

    console.log("Creating TTS for reply", replyId, targetLanguage);

    // Generate TTS using the new service
    const tts = await generateTTSWithLanguage(
      textToSynthesize,
      targetLanguage,
      {
        noise_scale: 0.6,
        provider,
        response_format: "wav",
      },
    );

    // Set appropriate headers for WAV audio
    res.setHeader("Content-Type", tts.contentType);
    res.setHeader("Content-Length", tts.contentLength);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="reply-${replyId}-tts.wav"`,
    );

    // Send the audio data
    res.send(Buffer.from(tts.audioBuffer));
  } catch (error) {
    console.error("Error generating TTS for reply:", error);

    if (error instanceof TTSError) {
      return res.status(error.statusCode || 500).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
