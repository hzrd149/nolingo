import ISO6391 from "iso-639-1";
import { lookup } from "bcp-47-match";

export const getLanguageName = (code: string) => {
  const languageName = ISO6391.getName(code);
  return languageName || code.toUpperCase();
};

/**
 * DeepL-supported language tags in BCP-47 format
 * These are the languages that DeepL supports for target languages
 */
const DEEPL_SUPPORTED_LANGUAGES = [
  // English variants
  "en-US",
  "en-GB",

  // German
  "de-DE",

  // French
  "fr-FR",

  // Spanish
  "es-ES",

  // Italian
  "it-IT",

  // Portuguese
  "pt-PT",
  "pt-BR",

  // Dutch
  "nl-NL",

  // Polish
  "pl-PL",

  // Russian
  "ru-RU",

  // Japanese
  "ja-JP",

  // Chinese
  "zh-CN",
  "zh-TW",

  // Korean
  "ko-KR",

  // Swedish
  "sv-SE",

  // Norwegian
  "nb-NO",

  // Danish
  "da-DK",

  // Finnish
  "fi-FI",

  // Czech
  "cs-CZ",

  // Hungarian
  "hu-HU",

  // Romanian
  "ro-RO",

  // Bulgarian
  "bg-BG",

  // Croatian
  "hr-HR",

  // Slovak
  "sk-SK",

  // Slovenian
  "sl-SI",

  // Estonian
  "et-EE",

  // Latvian
  "lv-LV",

  // Lithuanian
  "lt-LT",

  // Greek
  "el-GR",

  // Turkish
  "tr-TR",

  // Ukrainian
  "uk-UA",

  // Indonesian
  "id-ID",

  // Malay
  "ms-MY",

  // Thai
  "th-TH",

  // Vietnamese
  "vi-VN",

  // Arabic
  "ar-SA",

  // Hebrew
  "he-IL",

  // Hindi
  "hi-IN",
] as const;

/**
 * Maps short language codes to DeepL-compatible full language codes using BCP-47 matching
 * DeepL requires full language codes for target languages (e.g., 'en-GB', 'en-US', 'de-DE')
 * Source languages can still use short codes
 */
export const mapToDeepLLanguageCode = (
  languageCode: string,
  isTargetLanguage: boolean = true,
): string => {
  if (!isTargetLanguage) {
    // For source languages, DeepL still accepts short codes
    return languageCode;
  }

  // Use bcp-47-match to find the best matching language tag
  const matchedTag = lookup([...DEEPL_SUPPORTED_LANGUAGES], languageCode);

  // Return the matched tag or the original code if no match found
  return matchedTag || languageCode;
};
