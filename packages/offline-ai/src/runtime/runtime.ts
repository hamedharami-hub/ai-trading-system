export interface OfflineGenerationRequest {
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly jsonSchema: Readonly<Record<string, unknown>>;
  readonly maxTokens: number;
  readonly timeoutMs: number;
}

export interface OfflineGenerationResult {
  readonly json: unknown;
  readonly elapsedMs: number;
  readonly runtime: string;
}

export interface OfflineAiRuntime {
  generate(
    request: Readonly<OfflineGenerationRequest>,
  ): Promise<OfflineGenerationResult>;
  benchmark(): Promise<Readonly<Record<string, string | number>>>;
}
