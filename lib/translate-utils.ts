import {
  translate,
  detectLanguage as detectLanguageCore,
  type TranslateRequest,
  type DetectRequest,
} from "./translate";

/**
 * Simple function to translate text from one language to another
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
  const request: TranslateRequest = {
    q: text,
    target: targetLang,
    ...(sourceLang && { source: sourceLang }),
  };

  const response = await translate(request);
  return response.translatedText;
}

/**
 * Simple function to detect the language of text
 * @param text - Text to analyze
 * @returns Promise<{language: string, confidence: number}> - Detected language and confidence
 */
export async function detectLanguage(
  text: string,
): Promise<{ language: string; confidence: number }> {
  const request: DetectRequest = { q: text };
  const response = await detectLanguageCore(request);
  return {
    language: response.language,
    confidence: response.confidence,
  };
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
 * Get all supported languages
 * @returns Promise<Array<{code: string, name: string}>> - List of supported languages
 */
export async function getSupportedLanguages() {
  const { getLanguages } = await import("./translate");
  return getLanguages();
}

/**
 * Check if the translation service is available
 * @returns Promise<boolean> - True if service is available
 */
export async function isTranslationServiceAvailable(): Promise<boolean> {
  const { healthCheck } = await import("./translate");
  return healthCheck();
}
