"use server";

// Main translation interface that provides a unified API for all translation providers
import {
  translateWithFallback,
  TranslationProvider,
} from "./provider-selection";
import { detectLanguage as detectLanguageCore } from "./detect-language";
import { createLibreTranslateService } from "./libretranslate";

/**
 * Simple function to translate text from one language to another
 * Uses provider selection with automatic fallback
 * @param text - Text to translate
 * @param targetLang - Target language code (e.g., 'es', 'fr', 'de')
 * @param sourceLang - Source language code (optional, will auto-detect if not provided)
 * @returns Promise<string> - Translated text
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<string> {
  const { result } = await translateWithFallback(text, targetLang, sourceLang);
  return result;
}

/**
 * Translate text and return both result and provider used
 * @param text - Text to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (optional)
 * @returns Promise<{result: string, provider: TranslationProvider}> - Translation result with provider info
 */
export async function translateTextWithProvider(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<{ result: string; provider: TranslationProvider }> {
  return await translateWithFallback(text, targetLang, sourceLang);
}

/**
 * Simple function to detect the language of text
 * Always uses LibreTranslate as DeepL doesn't provide language detection
 * @param text - Text to analyze
 * @returns Promise<{language: string, confidence: number}> - Detected language and confidence
 */
export async function detectLanguage(
  text: string,
): Promise<{ language: string; confidence: number }> {
  return await detectLanguageCore(text);
}

/**
 * Translate text with auto-detection of source language
 * @param text - Text to translate
 * @param targetLang - Target language code
 * @returns Promise<string> - Translated text
 */
export async function translateWithAutoDetect(
  text: string,
  targetLang: string,
): Promise<string> {
  // First detect the source language
  const detection = await detectLanguage(text);

  // Then translate
  return translateText(text, targetLang, detection.language);
}

/**
 * Get all supported languages from LibreTranslate
 * Note: This uses LibreTranslate as it provides a comprehensive list
 * DeepL's supported languages are a subset of what LibreTranslate offers
 * @returns Promise<Array<{code: string, name: string}>> - List of supported languages
 */
export async function getSupportedLanguages(): Promise<
  Array<{ code: string; name: string }>
> {
  const libre = createLibreTranslateService();
  return await libre.getLanguages();
}

/**
 * Check if the translation service is available
 * Checks all providers and returns true if at least one is available
 * @returns Promise<boolean> - True if service is available
 */
export async function isTranslationServiceAvailable(): Promise<boolean> {
  const { getProvidersHealthStatus } = await import("./provider-selection");
  const status = await getProvidersHealthStatus();

  return status.deepl.healthy || status.libretranslate.healthy;
}

/**
 * Get detailed health status of all translation providers
 * @returns Promise<object> - Health status of all providers
 */
export async function getTranslationProvidersHealth(): Promise<{
  deepl: { configured: boolean; healthy: boolean };
  libretranslate: { configured: boolean; healthy: boolean };
}> {
  const { getProvidersHealthStatus } = await import("./provider-selection");
  return await getProvidersHealthStatus();
}

/**
 * Clear provider cache to force re-evaluation of provider health
 * Useful for testing or manual refresh
 */
export function refreshProviderCache(): void {
  const { clearProviderCache } = require("./provider-selection");
  clearProviderCache();
}

// Re-export types for convenience
export type { TranslationProvider } from "./provider-selection";
export type {
  Language,
  TranslateRequest as LibreTranslateRequest,
  TranslateResponse as LibreTranslateResponse,
} from "./libretranslate";
export type {
  DeepLConfig,
  TranslateRequest as DeepLTranslateRequest,
  TranslateResponse as DeepLTranslateResponse,
} from "./deepl-translate";
export type { DetectRequest, DetectResponse } from "./detect-language";
