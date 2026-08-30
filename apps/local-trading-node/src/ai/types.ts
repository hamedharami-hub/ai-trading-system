export type LLMProviderType = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OLLAMA' | 'MOCK';

export type AIRoleType = 'ANALYST' | 'CRITIC' | 'JUDGE' | 'AUDITOR';

export interface LLMCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCompletionResponse {
  content: string;
  parsedJson?: Record<string, unknown>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ILLMProvider {
  readonly providerType: LLMProviderType;
  generateCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}

export interface AIRouterMetrics {
  totalRequests: number;
  totalTokensUsed: number;
  roleCounts: Record<AIRoleType, number>;
  fallbackCount: number;
}
