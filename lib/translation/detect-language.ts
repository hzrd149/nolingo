interface DetectRequest {
  q: string;
}

interface DetectResponse {
  confidence: number;
  language: string;
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
 * Detect the language of the given text using LibreTranslate
 * Note: DeepL does not provide language detection, so we always use LibreTranslate for this
 */
export async function detectLanguage(
  text: string,
): Promise<{ language: string; confidence: number }> {
  const request: DetectRequest = { q: text };

  try {
    const baseUrl = getLibreTranslateBaseUrl();
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
 * Check if the LibreTranslate language detection service is available
 */
export async function isLanguageDetectionHealthy(): Promise<boolean> {
  try {
    // Test with a simple detection
    await detectLanguage("Hello world");
    return true;
  } catch (error) {
    console.error("Language detection health check failed:", error);
    return false;
  }
}

// Export types for use in other parts of the application
export type { DetectRequest, DetectResponse };
