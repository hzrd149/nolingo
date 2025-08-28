interface OpenAIConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CorrectionResult {
  correctedText: string;
  explanation: string;
}

/**
 * OpenAI-compatible corrections service
 * Provides grammar and spelling corrections using any OpenAI-compatible API
 */
export class OpenAICorrectionsService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  /**
   * Get grammar and spelling corrections for text
   */
  async getCorrections(
    text: string,
    learningLanguage?: string,
  ): Promise<CorrectionResult> {
    const language = learningLanguage
      ? learningLanguage.toUpperCase()
      : "the target language";

    const prompt = `You are a helpful language teacher. Please correct any grammar and spelling errors in the following text written in ${language}.

Return your response in exactly this format:
CORRECTED: [the corrected text without quotes]
EXPLANATION: [a single sentence explaining to the learner the mistakes]

Text to correct: "${text}"`;

    const requestBody: OpenAIRequest = {
      model: this.config.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `AI corrections API error (${response.status}): ${errorText}`,
        );
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from AI corrections API");
      }

      const content = data.choices[0].message.content;
      return this.parseResponse(content);
    } catch (error) {
      console.error("OpenAI corrections error:", error);
      throw new Error(
        `Failed to get corrections: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Parse the AI response to extract corrected text and explanation
   */
  private parseResponse(content: string): CorrectionResult {
    try {
      const correctedMatch = content.match(
        /CORRECTED:\s*(.+?)(?=EXPLANATION:|$)/s,
      );
      const explanationMatch = content.match(/EXPLANATION:\s*(.+?)$/s);

      if (!correctedMatch || !explanationMatch) {
        throw new Error("Invalid response format from AI");
      }

      return {
        correctedText: correctedMatch[1].trim(),
        explanation: explanationMatch[1].trim(),
      };
    } catch (error) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse correction response from AI");
    }
  }
}

/**
 * Create a corrections service instance if configured
 */
export function createOpenAICorrectionsService(): OpenAICorrectionsService | null {
  const apiKey = process.env.AI_CORRECTIONS_API_KEY;
  const apiUrl = process.env.AI_CORRECTIONS_API_URL;
  const model = process.env.AI_CORRECTIONS_MODEL;

  if (!apiKey || !apiUrl || !model) {
    console.warn(
      "AI corrections not configured: missing API key, URL, or model",
    );
    return null;
  }

  return new OpenAICorrectionsService({
    apiKey: apiKey.trim(),
    apiUrl: apiUrl.trim(),
    model: model.trim(),
  });
}

/**
 * Check if corrections service is configured
 */
export function isCorrectionsConfigured(): boolean {
  const apiKey = process.env.AI_CORRECTIONS_API_KEY;
  const apiUrl = process.env.AI_CORRECTIONS_API_URL;
  const model = process.env.AI_CORRECTIONS_MODEL;

  return !!(apiKey && apiUrl && model);
}

// Export types for use in other parts of the application
export type { OpenAIConfig, CorrectionResult };
