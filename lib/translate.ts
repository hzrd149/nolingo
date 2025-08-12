interface TranslateRequest {
  q: string;
  source?: string;
  target: string;
  format?: "text" | "html";
}

interface TranslateResponse {
  translatedText: string;
}

interface DetectRequest {
  q: string;
}

interface DetectResponse {
  confidence: number;
  language: string;
}

interface Language {
  code: string;
  name: string;
}

/**
 * Get the base URL for LibreTranslate API
 */
function getBaseUrl(): string {
  const apiUrl = process.env.LIBRETRANSLATE_API;
  if (!apiUrl) {
    throw new Error("LIBRETRANSLATE_API environment variable is not set");
  }
  return apiUrl.replace(/\/$/, ""); // Remove trailing slash if present
}

/**
 * Translate text from one language to another
 */
export async function translate(
  request: TranslateRequest,
): Promise<TranslateResponse> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Translation failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return { translatedText: data.translatedText };
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(
      `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Detect the language of the given text
 */
export async function detectLanguage(
  request: DetectRequest,
): Promise<DetectResponse> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Language detection failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    // LibreTranslate returns an array of detections, we take the first one
    const detection = Array.isArray(data) ? data[0] : data;
    return {
      confidence: detection.confidence,
      language: detection.language,
    };
  } catch (error) {
    console.error("Language detection error:", error);
    throw new Error(
      `Language detection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get list of supported languages
 */
export async function getLanguages(): Promise<Language[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/languages`);

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
export async function healthCheck(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/languages`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Export types for use in other parts of the application
export type {
  TranslateRequest,
  TranslateResponse,
  DetectRequest,
  DetectResponse,
  Language,
};
