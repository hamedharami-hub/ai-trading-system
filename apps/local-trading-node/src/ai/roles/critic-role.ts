import type { StrategyCandidatePayload, FeatureSnapshotPayload, AnalystProposalPayload, CriticProposalPayload } from '@trade/contracts';
import { validatePayload } from '@trade/contracts';
import type { ILLMProvider } from '../types.js';
import { PromptTemplates } from '../prompts/prompt-templates.js';

export class CriticRole {
  constructor(private readonly provider: ILLMProvider) {}

  public async evaluate(
    candidate: StrategyCandidatePayload,
    snapshot: FeatureSnapshotPayload,
    analyst: AnalystProposalPayload
  ): Promise<CriticProposalPayload> {
    const { systemPrompt, userPrompt } = PromptTemplates.buildCriticPrompt(candidate, snapshot, analyst);

    const completion = await this.provider.generateCompletion({
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.2
    });

    let rawData: Record<string, unknown>;
    try {
      rawData = completion.parsedJson ?? JSON.parse(completion.content);
    } catch {
      throw new Error(`Critic role received non-JSON output from LLM: "${completion.content}"`);
    }

    const evidenceKeys: [string, ...string[]] =
      Array.isArray(rawData.evidence_keys) && rawData.evidence_keys.length > 0
        ? [String(rawData.evidence_keys[0]), ...rawData.evidence_keys.slice(1).map(String)]
        : ['DEFAULT_RISK_CHECK'];

    const payload: CriticProposalPayload = {
      candidate_id: candidate.candidate_id,
      verdict: rawData.verdict as 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL',
      confidence: String(rawData.confidence || '0.50'),
      evidence_keys: evidenceKeys,
      evaluated_at: new Date().toISOString()
    };

    if (rawData.notes) {
      payload.notes = String(rawData.notes).slice(0, 1000);
    }

    // Schema validation (Fail-closed)
    const valRes = validatePayload('CRITIC_PROPOSAL', payload);
    if (!valRes.valid) {
      throw new Error(`CriticProposal failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    return payload;
  }
}
