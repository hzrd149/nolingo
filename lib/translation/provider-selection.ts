import {
  DeepLService,
  createDeepLService,
  isDeepLConfigured,
} from "./deepl-translate";
import {
  LibreTranslateService,
  createLibreTranslateService,
} from "./libretranslate";

export enum TranslationProvider {
  DEEPL = "deepl",
  LIBRETRANSLATE = "libretranslate",
}

/**
 * Select the best available translation provider
 * Priority: DeepL (if configured and healthy) -> LibreTranslate (fallback)
 */
export async function selectTranslationProvider(): Promise<TranslationProvider> {
  // Check if DeepL is configured
  if (isDeepLConfigured()) {
    try {
      const deepL = createDeepLService();
      if (deepL) {
        // Test if DeepL is healthy
        const isHealthy = await deepL.isHealthy();
        if (isHealthy) {
          console.log("Using DeepL as primary translation provider");
          return TranslationProvider.DEEPL;
        } else {
          console.warn(
            "DeepL is configured but unhealthy, falling back to LibreTranslate",
          );
        }
      }
    } catch (error) {
      console.warn(
        "DeepL provider check failed, falling back to LibreTranslate:",
        error,
      );
    }
  }

  console.log("Using LibreTranslate as translation provider");
  return TranslationProvider.LIBRETRANSLATE;
}

/**
 * Get a translation service instance based on provider type
 */
export function getTranslationService(
  provider: TranslationProvider,
): DeepLService | LibreTranslateService {
  switch (provider) {
    case TranslationProvider.DEEPL:
      const deepL = createDeepLService();
      if (!deepL) {
        throw new Error("DeepL service requested but not configured");
      }
      return deepL;

    case TranslationProvider.LIBRETRANSLATE:
    default:
      return createLibreTranslateService();
  }
}

/**
 * Cached provider selection to avoid repeated health checks
 */
let cachedProvider: TranslationProvider | null = null;
let cacheTimestamp: number = 0;
let healthCheckInProgress = false;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const INITIAL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for initial setup

/**
 * Get cached translation provider or select new one if cache is expired
 * Optimized to avoid repeated health checks
 */
export async function getCachedTranslationProvider(): Promise<TranslationProvider> {
  const now = Date.now();

  // Use cached provider if it's still valid
  if (cachedProvider && now - cacheTimestamp < CACHE_DURATION) {
    return cachedProvider;
  }

  // If health check is already in progress, wait for it or use current cached value
  if (healthCheckInProgress) {
    // Return cached value if available, otherwise wait briefly and retry
    if (cachedProvider) {
      console.log(
        `Provider selection in progress, using cached: ${cachedProvider}`,
      );
      return cachedProvider;
    }
    // Brief wait to avoid race conditions
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (cachedProvider) return cachedProvider;
  }

  // Start health check process
  healthCheckInProgress = true;

  try {
    // For initial selection, prefer DeepL if configured without health check
    if (!cachedProvider && isDeepLConfigured()) {
      console.log(
        "Initial provider selection: trying DeepL without health check",
      );
      cachedProvider = TranslationProvider.DEEPL;
      cacheTimestamp = now;

      // Schedule a health check in the background after initial setup
      setTimeout(async () => {
        try {
          await backgroundHealthCheck();
        } catch (error) {
          console.warn("Background health check failed:", error);
        }
      }, 5000); // 5 seconds delay

      return cachedProvider;
    }

    // Full provider selection with health check
    cachedProvider = await selectTranslationProvider();
    cacheTimestamp = now;

    return cachedProvider;
  } finally {
    healthCheckInProgress = false;
  }
}

/**
 * Background health check to update provider without blocking translations
 */
async function backgroundHealthCheck(): Promise<void> {
  if (!isDeepLConfigured()) {
    cachedProvider = TranslationProvider.LIBRETRANSLATE;
    cacheTimestamp = Date.now();
    return;
  }

  try {
    const deepL = createDeepLService();
    if (deepL) {
      const isHealthy = await deepL.isHealthy();
      if (isHealthy) {
        if (cachedProvider !== TranslationProvider.DEEPL) {
          console.log("Background check: DeepL is healthy, switching to DeepL");
          cachedProvider = TranslationProvider.DEEPL;
        }
      } else {
        if (cachedProvider === TranslationProvider.DEEPL) {
          console.log(
            "Background check: DeepL is unhealthy, switching to LibreTranslate",
          );
          cachedProvider = TranslationProvider.LIBRETRANSLATE;
        }
      }
      cacheTimestamp = Date.now();
    }
  } catch (error) {
    console.warn("Background DeepL health check failed:", error);
    if (cachedProvider === TranslationProvider.DEEPL) {
      cachedProvider = TranslationProvider.LIBRETRANSLATE;
      cacheTimestamp = Date.now();
    }
  }
}

/**
 * Clear the provider cache (useful for testing or manual refresh)
 */
export function clearProviderCache(): void {
  cachedProvider = null;
  cacheTimestamp = 0;
}

/**
 * Translate text with automatic provider selection and fallback
 */
export async function translateWithFallback(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<{ result: string; provider: TranslationProvider }> {
  let provider = await getCachedTranslationProvider();

  try {
    const service = getTranslationService(provider);
    const result = await service.translateText(text, targetLang, sourceLang);
    return { result, provider };
  } catch (error) {
    console.warn(
      `Translation failed with ${provider}, trying fallback:`,
      error,
    );

    // If DeepL failed, try LibreTranslate as fallback
    if (provider === TranslationProvider.DEEPL) {
      try {
        const fallbackService = getTranslationService(
          TranslationProvider.LIBRETRANSLATE,
        );
        const result = await fallbackService.translateText(
          text,
          targetLang,
          sourceLang,
        );

        // Update cache to use LibreTranslate for future requests
        cachedProvider = TranslationProvider.LIBRETRANSLATE;
        cacheTimestamp = Date.now();

        return { result, provider: TranslationProvider.LIBRETRANSLATE };
      } catch (fallbackError) {
        console.error("Both translation providers failed:", {
          primary: error,
          fallback: fallbackError,
        });
        throw new Error(
          `All translation providers failed. DeepL: ${error instanceof Error ? error.message : "Unknown error"}. LibreTranslate: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`,
        );
      }
    }

    // If LibreTranslate failed and it was the only option, throw the error
    throw error;
  }
}

/**
 * Get health status of all translation providers
 */
export async function getProvidersHealthStatus(): Promise<{
  deepl: { configured: boolean; healthy: boolean };
  libretranslate: { configured: boolean; healthy: boolean };
}> {
  const result = {
    deepl: { configured: false, healthy: false },
    libretranslate: { configured: true, healthy: false }, // LibreTranslate is always configured via env
  };

  // Check DeepL
  if (isDeepLConfigured()) {
    result.deepl.configured = true;
    try {
      const deepL = createDeepLService();
      if (deepL) {
        result.deepl.healthy = await deepL.isHealthy();
      }
    } catch (error) {
      console.error("DeepL health check error:", error);
    }
  }

  // Check LibreTranslate
  try {
    const libre = createLibreTranslateService();
    result.libretranslate.healthy = await libre.isHealthy();
  } catch (error) {
    console.error("LibreTranslate health check error:", error);
  }

  return result;
}
