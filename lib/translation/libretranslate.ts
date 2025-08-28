interface TranslateRequest {
  q: string;
  source?: string;
  target: string;
  format?: "text" | "html";
}

interface TranslateResponse {
  translatedText: string;
}

interface Language {
  code: string;
  name: string;
}

/**
 * Get the base URL for LibreTranslate API
 */
function getLibreTranslateBaseUrl(): string {
  const apiUrl = process.env.LIBRETRANSLATE_API;
  if (!apiUrl) {
    throw new Error("LIBRETRANSLATE_API environment variable is not set");
  }
  return apiUrl.replace(/\/$/, ""); // Remove trailing slash if present
}

/**
 * LibreTranslate Service
 * Provides translation using the self-hosted LibreTranslate API
 */
export class LibreTranslateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getLibreTranslateBaseUrl();
  }

  /**
   * Translate text from one language to another using LibreTranslate
   */
  async translateText(
    text: string,
    targetLang: string,
    sourceLang?: string,
  ): Promise<string> {
    const request: TranslateRequest = {
      q: text,
      target: targetLang,
      ...(sourceLang && { source: sourceLang }),
    };

    try {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `LibreTranslate translation failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error("LibreTranslate translation error:", error);
      throw new Error(
        `LibreTranslate translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get list of supported languages from LibreTranslate
   */
  async getLanguages(): Promise<Language[]> {
    try {
      const response = await fetch(`${this.baseUrl}/languages`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch languages: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.map((lang: any) => ({
        code: lang.code,
        name: lang.name,
      }));
    } catch (error) {
      console.error("Get languages error:", error);
      throw new Error(
        `Failed to fetch languages: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if the LibreTranslate service is available
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/languages`);
      return response.ok;
    } catch (error) {
      console.error("LibreTranslate health check failed:", error);
      return false;
    }
  }

  /**
   * Get the base URL being used for LibreTranslate
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Create a LibreTranslate service instance
 */
export function createLibreTranslateService(): LibreTranslateService {
  return new LibreTranslateService();
}

// Export types for use in other parts of the application
export type { TranslateRequest, TranslateResponse, Language };
