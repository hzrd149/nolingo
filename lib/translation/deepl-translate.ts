import * as deepl from "deepl-node";
import { mapToDeepLLanguageCode } from "../utils/language";

interface DeepLConfig {
  apiKey: string;
}

interface TranslateRequest {
  q: string;
  source?: string;
  target: string;
  format?: "text" | "html";
}

interface TranslateResponse {
  translatedText: string;
}

/**
 * DeepL Translation Service
 * Provides high-quality translation using the DeepL API
 */
export class DeepLService {
  private client: deepl.Translator;
  private config: DeepLConfig;

  constructor(config: DeepLConfig) {
    this.config = config;
    this.client = new deepl.Translator(config.apiKey);
  }

  /**
   * Translate text using DeepL API
   */
  async translateText(
    text: string,
    targetLang: string,
    sourceLang?: string,
  ): Promise<string> {
    try {
      // Map language codes to DeepL-compatible format
      const mappedTargetLang = mapToDeepLLanguageCode(targetLang, true);
      const mappedSourceLang = sourceLang
        ? mapToDeepLLanguageCode(sourceLang, false)
        : null;

      console.log(
        `DeepL translation: ${sourceLang || "auto"} -> ${targetLang} (mapped: ${mappedSourceLang || "auto"} -> ${mappedTargetLang})`,
      );

      const result = await this.client.translateText(
        text,
        (mappedSourceLang as deepl.SourceLanguageCode) || null, // DeepL auto-detects when null
        mappedTargetLang as deepl.TargetLanguageCode,
      );

      return result.text;
    } catch (error) {
      console.error("DeepL translation error:", error);
      throw new Error(
        `DeepL translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if the DeepL service is healthy and API key is valid
   * Uses minimal API calls to avoid unnecessary usage
   */
  async isHealthy(): Promise<boolean> {
    try {
      // First try to get usage info - this is a lightweight call that validates the API key
      await this.client.getUsage();
      return true;
    } catch (error) {
      // If usage check fails, the API key is invalid or service is down
      console.error("DeepL health check failed:", error);
      return false;
    }
  }

  /**
   * Get DeepL usage information
   */
  async getUsage(): Promise<deepl.Usage> {
    try {
      return await this.client.getUsage();
    } catch (error) {
      console.error("Failed to get DeepL usage:", error);
      throw new Error(
        `Failed to get DeepL usage: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get supported source languages
   */
  async getSourceLanguages(): Promise<readonly deepl.Language[]> {
    try {
      return await this.client.getSourceLanguages();
    } catch (error) {
      console.error("Failed to get DeepL source languages:", error);
      throw new Error(
        `Failed to get DeepL source languages: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get supported target languages
   */
  async getTargetLanguages(): Promise<readonly deepl.Language[]> {
    try {
      return await this.client.getTargetLanguages();
    } catch (error) {
      console.error("Failed to get DeepL target languages:", error);
      throw new Error(
        `Failed to get DeepL target languages: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

/**
 * Create a DeepL service instance if API key is available
 */
export function createDeepLService(): DeepLService | null {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  return new DeepLService({ apiKey });
}

/**
 * Check if DeepL is configured and available
 */
export function isDeepLConfigured(): boolean {
  const apiKey = process.env.DEEPL_API_KEY;
  return !!(apiKey && apiKey.trim() !== "");
}

// Export types for use in other parts of the application
export type { DeepLConfig, TranslateRequest, TranslateResponse };
