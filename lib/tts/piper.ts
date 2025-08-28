import { logger } from "../debug";

export interface PiperVoice {
  audio: {
    quality: string;
    sample_rate: number;
  };
  dataset: string;
  espeak: {
    voice: string;
  };
  inference: {
    length_scale: number;
    noise_scale: number;
    noise_w: number;
  };
  language: {
    code: string;
    country_english: string;
    family: string;
    name_english: string;
    name_native: string;
    region: string;
  };
  num_speakers: number;
  num_symbols: number;
}

export interface PiperVoices {
  [voiceId: string]: PiperVoice;
}

export interface PiperTTSOptions {
  text: string;
  voice?: string;
  noise_scale?: number;
  length_scale?: number;
  noise_w?: number;
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

const log = logger.extend("tts:piper");

/** Fetches the list of available voices from the Piper TTS service */
export async function getAvailableVoices(): Promise<PiperVoices> {
  log("Getting available Piper voices");

  const piperApiUrl = process.env.PIPER_API;
  if (!piperApiUrl) throw new TTSError("Piper TTS service not configured", 500);

  try {
    const response = await fetch(`${piperApiUrl}/voices`);

    if (!response.ok)
      throw new TTSError(
        `Failed to fetch Piper voices: ${response.statusText}`,
        response.status,
      );

    const voices: PiperVoices = await response.json();
    return voices;
  } catch (error) {
    if (error instanceof TTSError) throw error;

    throw new TTSError(
      `Failed to fetch Piper voices: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
    );
  }
}

/** Gets a voice by language code (e.g., 'de_DE', 'en_US') */
export function getVoiceByLanguage(
  voices: PiperVoices,
  languageCode: string,
): string | null {
  for (const [voiceId, voice] of Object.entries(voices)) {
    if (voice.language.code === languageCode) return voiceId;
  }
  return null;
}

/** Gets a voice by language family (e.g., 'de', 'en') */
export function getVoiceByLanguageFamily(
  voices: PiperVoices,
  languageFamily: string,
): string | null {
  for (const [voiceId, voice] of Object.entries(voices)) {
    if (voice.language.family === languageFamily) {
      return voiceId;
    }
  }
  return null;
}

/** Gets the best available voice for a given language, with fallback logic */
export function getBestVoiceForLanguage(
  voices: PiperVoices,
  language: string,
): string | null {
  log(`🔍 Piper voice search for language: "${language}"`);

  // First try exact language code match
  let voiceId = getVoiceByLanguage(voices, language);
  if (voiceId) {
    log(`✅ Found exact Piper language match: "${voiceId}" for "${language}"`);
    return voiceId;
  }
  log(`❌ No exact Piper language match for "${language}"`);

  // Extract language family from target language (e.g., 'de' from 'de_DE')
  const languageFamily = language.split("_")[0];
  log(`🔍 Trying Piper language family: "${languageFamily}"`);
  voiceId = getVoiceByLanguageFamily(voices, languageFamily);
  if (voiceId) {
    log(
      `✅ Found Piper language family match: "${voiceId}" for "${languageFamily}"`,
    );
    return voiceId;
  }
  log(`❌ No Piper language family match for "${languageFamily}"`);

  // Fallback to English if available
  if (language !== "en" && language !== "en_US") {
    log(`🔍 Falling back to English voices for Piper...`);
    voiceId =
      getVoiceByLanguage(voices, "en_US") ||
      getVoiceByLanguageFamily(voices, "en");
    if (voiceId) {
      log(
        `⚠️ Using English fallback Piper voice: "${voiceId}" for "${language}"`,
      );
      return voiceId;
    }
    log(`❌ No English fallback available in Piper`);
  }

  // Return first available voice as last resort
  const availableVoiceIds = Object.keys(voices);
  const firstVoice = availableVoiceIds.length > 0 ? availableVoiceIds[0] : null;
  if (firstVoice) {
    log(
      `⚠️ Using first available Piper voice as last resort: "${firstVoice}" for "${language}"`,
    );
  } else {
    log(`💥 No Piper voices available at all`);
  }
  return firstVoice;
}

/** Generates TTS audio using the Piper TTS service */
export async function generatePiperTTS(
  options: PiperTTSOptions,
): Promise<TTSResult> {
  const piperApiUrl = process.env.PIPER_API;
  if (!piperApiUrl) {
    throw new TTSError("Piper TTS service not configured", 500);
  }

  if (!options.text || options.text.trim().length === 0) {
    throw new TTSError("Text is required for TTS generation", 400);
  }

  try {
    // Prepare request body with default values
    const requestBody = {
      text: options.text.trim(),
      noise_scale: options.noise_scale ?? 0.667,
      length_scale: options.length_scale ?? 1.0,
      noise_w: options.noise_w ?? 0.8,
    };

    // Add voice if specified
    if (options.voice) {
      (requestBody as any).voice = options.voice;
    }

    const response = await fetch(piperApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new TTSError(
        `Piper TTS generation failed: ${errorText}`,
        response.status,
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return {
      audioBuffer,
      contentType: "audio/wav",
      contentLength: audioBuffer.byteLength,
    };
  } catch (error) {
    if (error instanceof TTSError) {
      throw error;
    }
    throw new TTSError(
      `Piper TTS generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
    );
  }
}

/** Generates TTS audio with automatic voice selection based on language */
export async function generatePiperTTSWithLanguage(
  text: string,
  language: string,
  options?: Partial<PiperTTSOptions>,
): Promise<TTSResult> {
  // Fetch available Piper voices
  const voices = await getAvailableVoices();
  const selectedVoice = getBestVoiceForLanguage(voices, language);

  if (!selectedVoice)
    throw new TTSError(
      "No suitable Piper voice found for the target language",
      400,
    );

  log(
    "Generating Piper TTS with language",
    language,
    "and voice",
    selectedVoice,
  );

  // Generate TTS with the selected voice
  return generatePiperTTS({
    ...options,
    text,
    voice: selectedVoice,
  });
}
