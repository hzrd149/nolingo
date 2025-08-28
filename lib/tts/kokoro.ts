import { logger } from "../debug";

export interface KokoroVoice {
  id: string;
  language: string;
  region: string;
  gender: string;
  description?: string;
}

export interface KokoroVoices {
  voices: string[];
}

export interface KokoroSpeechRequest {
  model: string;
  input: string;
  voice: string;
  response_format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  speed?: number;
  volume_multiplier?: number;
  lang_code?: string;
}

export interface KokoroTTSOptions {
  text: string;
  voice?: string;
  model?: string;
  response_format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  speed?: number;
  volume_multiplier?: number;
}

export interface TTSResult {
  audioBuffer: ArrayBuffer;
  contentType: string;
  contentLength: number;
}

export class TTSError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "TTSError";
  }
}

const log = logger.extend("tts:kokoro");

/**
 * Fetches the list of available voices from the Kokoro TTS service
 */
export async function getAvailableKokoroVoices(): Promise<KokoroVoices> {
  log("Getting available Kokoro voices");

  const kokoroApiUrl = process.env.KOKORO_API;
  if (!kokoroApiUrl)
    throw new TTSError("Kokoro TTS service not configured", 500);

  try {
    const response = await fetch(`${kokoroApiUrl}/v1/audio/voices`);

    if (!response.ok) {
      throw new TTSError(
        `Failed to fetch Kokoro voices: ${response.statusText}`,
        response.status,
      );
    }

    const voices: KokoroVoices = await response.json();
    return voices;
  } catch (error) {
    if (error instanceof TTSError) {
      throw error;
    }
    throw new TTSError(
      `Failed to fetch Kokoro voices: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
    );
  }
}

/**
 * Gets a Kokoro voice by language prefix (e.g., 'a' for American English, 'b' for British English, 'z' for Chinese)
 */
export function getKokoroVoiceByLanguage(
  voices: KokoroVoices,
  languageCode: string,
): string | null {
  // Map common language codes to Kokoro voice prefixes
  const languageMap: Record<string, string[]> = {
    en: ["af_", "am_"], // American English (female/male)
    en_US: ["af_", "am_"], // American English
    en_GB: ["bf_", "bm_"], // British English
    zh: ["zf_", "zm_"], // Chinese
    zh_CN: ["zf_", "zm_"], // Chinese
    zh_TW: ["zf_", "zm_"], // Chinese Traditional
    ja: ["jf_", "jm_"], // Japanese
    ja_JP: ["jf_", "jm_"], // Japanese
    ko: ["jf_", "jm_"], // Korean (using Japanese voices as closest approximation)
    ko_KR: ["jf_", "jm_"], // Korean
    hi: ["hf_", "hm_"], // Hindi
    es: ["ef_", "em_"], // Spanish
    pt: ["pf_", "pm_"], // Portuguese
    fr: ["ff_"], // French
    it: ["if_", "im_"], // Italian
  };

  const prefixes =
    languageMap[languageCode] || languageMap[languageCode.split("_")[0]];
  if (!prefixes) return null;

  // Find first available voice with matching prefix
  for (const prefix of prefixes) {
    const voice = voices.voices.find((v) => v.startsWith(prefix));
    if (voice) return voice;
  }

  return null;
}

/**
 * Gets the best available Kokoro voice for a given language, with fallback logic
 */
export function getBestKokoroVoiceForLanguage(
  voices: KokoroVoices,
  targetLanguage: string,
): string | null {
  log(`🔍 Kokoro voice search for language: "${targetLanguage}"`);

  // First try exact language match
  let voiceId = getKokoroVoiceByLanguage(voices, targetLanguage);
  if (voiceId) {
    log(
      `✅ Found exact Kokoro language match: "${voiceId}" for "${targetLanguage}"`,
    );
    return voiceId;
  }
  log(`❌ No exact Kokoro language match for "${targetLanguage}"`);

  // Extract language family from target language (e.g., 'en' from 'en_US')
  const languageFamily = targetLanguage.split("_")[0];
  log(`🔍 Trying Kokoro language family: "${languageFamily}"`);
  voiceId = getKokoroVoiceByLanguage(voices, languageFamily);
  if (voiceId) {
    log(
      `✅ Found Kokoro language family match: "${voiceId}" for "${languageFamily}"`,
    );
    return voiceId;
  }
  log(`❌ No Kokoro language family match for "${languageFamily}"`);

  // Fallback to English if available
  if (targetLanguage !== "en" && targetLanguage !== "en_US") {
    log(`🔍 Falling back to English voices for Kokoro...`);
    voiceId =
      getKokoroVoiceByLanguage(voices, "en_US") ||
      getKokoroVoiceByLanguage(voices, "en");
    if (voiceId) {
      log(
        `⚠️ Using English fallback Kokoro voice: "${voiceId}" for "${targetLanguage}"`,
      );
      return voiceId;
    }
    log(`❌ No English fallback available in Kokoro`);
  }

  // Return first available voice as last resort
  const firstVoice = voices.voices.length > 0 ? voices.voices[0] : null;
  if (firstVoice) {
    log(
      `⚠️ Using first available Kokoro voice as last resort: "${firstVoice}" for "${targetLanguage}"`,
    );
  } else {
    log(`💥 No Kokoro voices available at all`);
  }
  return firstVoice;
}

/** Generates TTS audio using the Kokoro TTS service */
export async function generateKokoroTTS(
  options: KokoroTTSOptions,
): Promise<TTSResult> {
  const kokoroApiUrl = process.env.KOKORO_API;
  if (!kokoroApiUrl)
    throw new TTSError("Kokoro TTS service not configured", 500);

  if (!options.text || options.text.trim().length === 0)
    throw new TTSError("Text is required for TTS generation", 400);

  try {
    const requestBody: KokoroSpeechRequest = {
      model: options.model || "kokoro",
      input: options.text.trim(),
      voice: options.voice || "af_heart",
      response_format: options.response_format || "wav",
      speed: options.speed || 1.0,
      volume_multiplier: options.volume_multiplier || 1.0,
    };

    log("kokoro request", requestBody);

    const response = await fetch(`${kokoroApiUrl}/v1/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new TTSError(
        `Kokoro TTS generation failed: ${errorText}`,
        response.status,
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "audio/wav";

    return {
      audioBuffer,
      contentType,
      contentLength: audioBuffer.byteLength,
    };
  } catch (error) {
    if (error instanceof TTSError) throw error;

    throw new TTSError(
      `Kokoro TTS generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
    );
  }
}

/**
 * Generates TTS audio with automatic voice selection based on language
 */
export async function generateKokoroTTSWithLanguage(
  text: string,
  language: string,
  options?: Partial<KokoroTTSOptions>,
): Promise<TTSResult> {
  // Fetch available Kokoro voices
  const voices = await getAvailableKokoroVoices();
  const selectedVoice = getBestKokoroVoiceForLanguage(voices, language);

  if (!selectedVoice)
    throw new TTSError(
      "No suitable Kokoro voice found for the target language",
      400,
    );

  log(
    "Generating Kokoro TTS with language",
    language,
    "and voice",
    selectedVoice,
  );

  // Generate TTS with the selected voice
  return generateKokoroTTS({
    ...options,
    text,
    voice: selectedVoice,
  });
}

/**
 * Checks if Kokoro should be used for a given language
 */
export function shouldUseKokoroForLanguage(language: string): boolean {
  const languageFamily = language.split("_")[0].toLowerCase();
  const kokoroLanguages = ["ja", "ko", "zh", "chinese", "japanese", "korean"];

  return kokoroLanguages.includes(languageFamily);
}
