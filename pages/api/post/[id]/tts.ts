import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getPostWithTranslation } from "@/lib/posts";
import { generateTTSWithLanguage, TTSError } from "@/lib/tts";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const postId = parseInt(req.query.id as string);

    if (isNaN(postId))
      return res.status(400).json({ error: "Invalid post ID" });

    // Get user session to determine target language for translation
    const session = await getServerSession(req, res, authOptions);
    const targetLanguage =
      req.query.lang || session?.user?.learning_language || "en";
    const provider = req.query.provider as "piper" | "kokoro" | undefined;

    // Fetch post with translation
    const post = await getPostWithTranslation(postId, targetLanguage);

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Determine what text to synthesize - prefer translated content
    const textToSynthesize = post.translation?.content || post.content;

    if (!textToSynthesize)
      return res.status(400).json({ error: "No content to synthesize" });

    console.log("Creating TTS for post", postId, targetLanguage);

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
      `inline; filename="post-${postId}-tts.wav"`,
    );

    // Send the audio data
    res.send(Buffer.from(tts.audioBuffer));
  } catch (error) {
    console.error("Error generating TTS for post:", error);

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
