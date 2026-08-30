import type { StrategyCandidatePayload, AnalystProposalPayload, CriticProposalPayload, JudgeDecisionPayload } from '@trade/contracts';
import { validatePayload } from '@trade/contracts';
import type { ILLMProvider } from '../types.js';
import { PromptTemplates } from '../prompts/prompt-templates.js';

export class JudgeRole {
  constructor(private readonly provider: ILLMProvider) {}

  public async evaluate(
    candidate: StrategyCandidatePayload,
    analyst: AnalystProposalPayload,
    critic: CriticProposalPayload,
    reanalysisCount = 0
  ): Promise<JudgeDecisionPayload> {
    const { systemPrompt, userPrompt } = PromptTemplates.buildJudgePrompt(candidate, analyst, critic);

    const completion = await this.provider.generateCompletion({
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.0
    });

    let rawData: Record<string, unknown>;
    try {
      rawData = completion.parsedJson ?? JSON.parse(completion.content);
    } catch {
      throw new Error(`Judge role received non-JSON output from LLM: "${completion.content}"`);
    }

    const payload: JudgeDecisionPayload = {
      candidate_id: candidate.candidate_id,
      decision: rawData.decision as 'APPROVE' | 'REJECT' | 'REANALYZE',
      reason: String(rawData.reason || 'Judge evaluation completed.').slice(0, 1000),
      reanalysis_count: typeof rawData.reanalysis_count === 'number' ? rawData.reanalysis_count : reanalysisCount,
      decided_at: new Date().toISOString()
    };

    // Schema validation (Fail-closed)
    const valRes = validatePayload('JUDGE_DECISION', payload);
    if (!valRes.valid) {
      throw new Error(`JudgeDecision failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    return payload;
  }
}
