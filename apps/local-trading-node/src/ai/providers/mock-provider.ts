import type { ILLMProvider, LLMCompletionRequest, LLMCompletionResponse, LLMProviderType } from '../types.js';

export class MockLLMProvider implements ILLMProvider {
  public readonly providerType: LLMProviderType = 'MOCK';
  private customResponse: string | null = null;

  public setCustomResponse(response: string | null): void {
    this.customResponse = response;
  }

  public async generateCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (this.customResponse) {
      return {
        content: this.customResponse,
        usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 }
      };
    }

    const sys = request.systemPrompt || '';

    // Check system prompt first to accurately distinguish roles
    if (sys.includes('Judge') || request.prompt.includes('Judge Synthesis')) {
      const payload = {
        decision: 'APPROVE',
        reason: 'Consensus reached between Analyst and Critic with strong risk metrics.',
        reanalysis_count: 0
      };
      return {
        content: JSON.stringify(payload),
        parsedJson: payload,
        usage: { promptTokens: 150, completionTokens: 30, totalTokens: 180 }
      };
    }

    if (sys.includes('Critic') || request.prompt.includes('Critic Adversarial')) {
      const payload = {
        verdict: 'FAVORABLE',
        confidence: '0.80',
        evidence_keys: ['VALID_RISK_REWARD', 'NO_NEARBY_LIQUIDITY_TRAP'],
        notes: 'Mock Critic: No prohibitive counter-trend traps detected.'
      };
      return {
        content: JSON.stringify(payload),
        parsedJson: payload,
        usage: { promptTokens: 120, completionTokens: 45, totalTokens: 165 }
      };
    }

    if (sys.includes('Analyst') || request.prompt.includes('Analyst Evaluation')) {
      const payload = {
        verdict: 'FAVORABLE',
        confidence: '0.85',
        evidence_keys: ['SMC_BOS_CONFIRMED', 'UNMITIGATED_FVG', 'POSITIVE_CVD'],
        notes: 'Mock Analyst: High confluence structure alignment observed.'
      };
      return {
        content: JSON.stringify(payload),
        parsedJson: payload,
        usage: { promptTokens: 100, completionTokens: 40, totalTokens: 140 }
      };
    }

    const defaultPayload = { message: 'Mock response generated successfully' };
    return {
      content: JSON.stringify(defaultPayload),
      parsedJson: defaultPayload,
      usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 }
    };
  }
}
