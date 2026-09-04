// English Pro - TypeScript Type Definitions

/**
 * Request payload for translation
 */
export interface TranslationRequest {
  spanishPhrase: string;
}

/**
 * Parsed translation response with four sections
 */
export interface TranslationResponse {
  principalTranslation: string;
  grammaticalAnalysis: string;
  learningKey: string;
  technicalVariations: string;
}

/**
 * Together.ai API response structure
 */
export interface TogetherAIResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Card variant types for styling
 */
export type CardVariant = 'translation' | 'grammar' | 'tips' | 'variations';

/**
 * Props for ResultCard component
 */
export interface ResultCardProps {
  readonly title: string;
  readonly content: string;
  readonly icon: string;
  readonly variant: CardVariant;
}

/**
 * Error state for API calls
 */
export interface ErrorState {
  message: string;
  code?: string;
}
