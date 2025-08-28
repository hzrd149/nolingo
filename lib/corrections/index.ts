"use server";

import {
  OpenAICorrectionsService,
  createOpenAICorrectionsService,
  isCorrectionsConfigured,
  CorrectionResult
} from "./openai-corrections";

/**
 * Get grammar and spelling corrections for text
 * @param text - Text to correct
 * @param learningLanguage - User's learning language (optional, from session)
 * @returns Promise<CorrectionResult> - Corrected text with explanation
 */
export async function getTextCorrections(
  text: string,
  learningLanguage?: string
): Promise<CorrectionResult> {
  const service = createOpenAICorrectionsService();
  
  if (!service) {
    throw new Error("AI corrections service is not configured. Please check environment variables.");
  }

  return await service.getCorrections(text, learningLanguage);
}

/**
 * Check if the corrections service is available
 * @returns boolean - True if service is configured
 */
export function isCorrectionsServiceAvailable(): boolean {
  return isCorrectionsConfigured();
}

// Re-export types for convenience
export type { CorrectionResult } from "./openai-corrections";
