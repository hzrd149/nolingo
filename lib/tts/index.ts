// Re-export types and functions from separate providers
export type { KokoroSpeechRequest, KokoroVoice, KokoroVoices } from "./kokoro";
export type { PiperVoice, PiperVoices } from "./piper";

// Import provider-specific functions
import {
  generatePiperTTS,
  generatePiperTTSWithLanguage,
  getBestVoiceForLanguage as getBestPiperVoice,
  getAvailableVoices as getPiperVoices,
  type PiperTTSOptions,
  type PiperVoices,
} from "./piper";

import {
  generateKokoroTTS,
  generateKokoroTTSWithLanguage,
  getAvailableKokoroVoices,
  getBestKokoroVoiceForLanguage,
  shouldUseKokoroForLanguage,
  type KokoroTTSOptions,
  type KokoroVoices,
} from "./kokoro";
import { logger } from "../debug";

// Common interfaces
export interface TTSOptions {
  text: string;
  voice?: string;
  // Piper-specific options
  noise_scale?: number;
  length_scale?: number;
  noise_w?: number;
  // Kokoro-specific options
  model?: string;
  response_format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  speed?: number;
  volume_multiplier?: number;
  // Provider selection
  provider?: "piper" | "kokoro" | "auto";
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

const log = logger.extend("tts");

// Cache for voices to avoid repeated API calls during runtime
let cachedPiperVoices: PiperVoices | null = null;
let cachedKokoroVoices: KokoroVoices | null = null;

/** Cached Piper voice fetching */
async function getCachedPiperVoices(): Promise<PiperVoices> {
  if (cachedPiperVoices) {
    log("Using cached Piper voices");
    return cachedPiperVoices;
  }

  log("Fetching Piper voices from API");
  cachedPiperVoices = await getPiperVoices();
  log(`Cached ${Object.keys(cachedPiperVoices).length} Piper voices`);
  return cachedPiperVoices;
}

/** Cached Kokoro voice fetching */
async function getCachedKokoroVoices(): Promise<KokoroVoices> {
  if (cachedKokoroVoices) {
    log("Using cached Kokoro voices");
    return cachedKokoroVoices;
  }

  log("Fetching Kokoro voices from API");
  cachedKokoroVoices = await getAvailableKokoroVoices();
  log(`Cached ${cachedKokoroVoices.voices.length} Kokoro voices`);
  return cachedKokoroVoices;
}

/** Determines the best TTS provider for a given language */
export function selectProviderForLanguage(
  language: string,
  preferred?: "piper" | "kokoro" | "auto",
): "piper" | "kokoro" {
  log(
    `🎯 Provider selection for language: "${language}", preferred: "${preferred || "auto"}"`,
  );

  // If a specific provider is requested (and not "auto"), use it
  if (preferred === "piper" || preferred === "kokoro") {
    log(`✅ Using explicitly preferred provider: ${preferred}`);
    return preferred;
  }

  // Smart selection based on language
  const shouldUseKokoro = shouldUseKokoroForLanguage(language);
  log(`🤖 shouldUseKokoroForLanguage("${language}") = ${shouldUseKokoro}`);

  if (shouldUseKokoro) {
    log(`✅ Selected provider: kokoro (language match)`);
    return "kokoro";
  }

  log(`✅ Selected provider: piper (default fallback)`);
  return "piper";
}

/** Fetches available voices from all providers */
export async function getAllAvailableVoices(): Promise<{
  piper: PiperVoices;
  kokoro: KokoroVoices;
}> {
  try {
    const [piperVoices, kokoroVoices] = await Promise.allSettled([
      getCachedPiperVoices(),
      getCachedKokoroVoices(),
    ]);

    return {
      piper: piperVoices.status === "fulfilled" ? piperVoices.value : {},
      kokoro:
        kokoroVoices.status === "fulfilled"
          ? kokoroVoices.value
          : { voices: [] },
    };
  } catch (error) {
    throw new TTSError(
      `Failed to fetch voices from providers: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
    );
  }
}

/** Gets available voices for the specified provider */
export async function getAvailableVoices(provider?: "piper" | "kokoro") {
  if (provider === "kokoro") return getCachedKokoroVoices();
  return getCachedPiperVoices();
}

/** Selects the best TTS provider and voice for a given language */
export async function selectBestProviderAndVoice(
  targetLanguage: string,
  preferredProvider?: "piper" | "kokoro" | "auto",
): Promise<{ provider: "piper" | "kokoro"; voice: string }> {
  log(`🎵 Starting voice selection for language: "${targetLanguage}"`);

  const selectedProvider = selectProviderForLanguage(
    targetLanguage,
    preferredProvider,
  );

  if (selectedProvider === "kokoro") {
    log(`🎤 Attempting Kokoro voice selection...`);
    try {
      const voices = await getCachedKokoroVoices();
      log(`📋 Available Kokoro voices: ${voices.voices.length} total`);
      log(
        `📋 Kokoro voice list: ${voices.voices.slice(0, 10).join(", ")}${voices.voices.length > 10 ? "..." : ""}`,
      );

      const voice = getBestKokoroVoiceForLanguage(voices, targetLanguage);
      if (voice) {
        log(
          `✅ Kokoro voice selected: "${voice}" for language "${targetLanguage}"`,
        );
        return { provider: "kokoro", voice };
      } else {
        log(
          `❌ No suitable Kokoro voice found for language "${targetLanguage}"`,
        );
      }
    } catch (error) {
      // Fall back to Piper if Kokoro fails
      log(`💥 Kokoro TTS failed, falling back to Piper:`, error);
      console.warn("Kokoro TTS failed, falling back to Piper:", error);
    }
  }

  // Use Piper as fallback or primary choice
  log(
    `🎤 Using Piper voice selection (${selectedProvider === "kokoro" ? "fallback" : "primary choice"})...`,
  );
  const voices = await getCachedPiperVoices();
  log(`📋 Available Piper voices: ${Object.keys(voices).length} total`);

  // Log some example Piper voices for debugging
  const piperVoiceList = Object.keys(voices).slice(0, 5);
  log(
    `📋 Sample Piper voices: ${piperVoiceList.join(", ")}${Object.keys(voices).length > 5 ? "..." : ""}`,
  );

  const voice = getBestPiperVoice(voices, targetLanguage);
  if (voice) {
    log(`✅ Piper voice selected: "${voice}" for language "${targetLanguage}"`);
    return { provider: "piper", voice };
  }

  log(`💥 No suitable voice found for language: "${targetLanguage}"`);
  throw new TTSError(
    `No suitable voice found for language: ${targetLanguage}`,
    400,
  );
}

/** Generates TTS audio using the specified or automatically selected provider */
export async function generateTTS(options: TTSOptions): Promise<TTSResult> {
  const provider = options.provider || "auto";

  // If provider is "auto", we need a language to make the selection
  // For manual provider selection, use the specified provider
  if (provider === "auto") {
    throw new TTSError(
      "Language-based auto selection requires using generateTTSWithLanguage",
      400,
    );
  }

  switch (provider) {
    case "kokoro": {
      const kokoroOptions: KokoroTTSOptions = {
        text: options.text,
        voice: options.voice,
        model: options.model,
        response_format: options.response_format,
        speed: options.speed,
        volume_multiplier: options.volume_multiplier,
      };
      return generateKokoroTTS(kokoroOptions);
    }
    case "piper": {
      const piperOptions: PiperTTSOptions = {
        text: options.text,
        voice: options.voice,
        noise_scale: options.noise_scale,
        length_scale: options.length_scale,
        noise_w: options.noise_w,
      };
      return generatePiperTTS(piperOptions);
    }
    default:
      throw new TTSError(`Unsupported TTS provider: ${provider}`, 400);
  }
}

/** Generates TTS audio with automatic provider and voice selection based on language */
export async function generateTTSWithLanguage(
  text: string,
  language: string,
  options?: Partial<TTSOptions>,
): Promise<TTSResult> {
  const provider = selectProviderForLanguage(language, options?.provider);

  try {
    if (provider === "kokoro") {
      const kokoroOptions: Partial<KokoroTTSOptions> = {
        model: options?.model,
        response_format: options?.response_format,
        speed: options?.speed,
        volume_multiplier: options?.volume_multiplier,
        voice: options?.voice,
      };
      return await generateKokoroTTSWithLanguage(text, language, kokoroOptions);
    } else {
      const piperOptions: Partial<PiperTTSOptions> = {
        noise_scale: options?.noise_scale,
        length_scale: options?.length_scale,
        noise_w: options?.noise_w,
        voice: options?.voice,
      };
      return await generatePiperTTSWithLanguage(text, language, piperOptions);
    }
  } catch (error) {
    // If the selected provider fails, try the other one as fallback
    console.warn(`${provider} TTS failed, trying fallback provider:`, error);

    const fallbackProvider = provider === "kokoro" ? "piper" : "kokoro";

    try {
      if (fallbackProvider === "kokoro") {
        const kokoroOptions: Partial<KokoroTTSOptions> = {
          model: options?.model,
          response_format: options?.response_format,
          speed: options?.speed,
          volume_multiplier: options?.volume_multiplier,
          voice: options?.voice,
        };
        return await generateKokoroTTSWithLanguage(
          text,
          language,
          kokoroOptions,
        );
      } else {
        const piperOptions: Partial<PiperTTSOptions> = {
          noise_scale: options?.noise_scale,
          length_scale: options?.length_scale,
          noise_w: options?.noise_w,
          voice: options?.voice,
        };
        return await generatePiperTTSWithLanguage(text, language, piperOptions);
      }
    } catch (fallbackError) {
      // If both providers fail, throw the original error
      throw error;
    }
  }
}

// Re-export provider-specific functions for advanced usage
export {
  generateKokoroTTS,
  generateKokoroTTSWithLanguage,
  generatePiperTTS,
  generatePiperTTSWithLanguage,
  getAvailableKokoroVoices,
  getPiperVoices as getAvailablePiperVoices,
  shouldUseKokoroForLanguage,
};
