import type { PolicyDecisionPayload, UUIDv7 } from '@trade/contracts';
import { validatePayload } from '@trade/contracts';

export interface HumanReviewInput {
  candidateId: UUIDv7;
  approved: boolean;
  notes?: string;
  counterTrendAllowed?: boolean;
}

export class HumanReviewLayer {
  private reviewHistory = new Map<UUIDv7, PolicyDecisionPayload>();

  /**
   * Records human operator verdict and produces authoritative PolicyDecisionPayload.
   */
  public evaluateHumanDecision(input: HumanReviewInput): PolicyDecisionPayload {
    const blockReasons: string[] = [];

    if (!input.approved) {
      blockReasons.push(input.notes || 'Manually rejected by human operator');
    }

    const payload: PolicyDecisionPayload = {
      candidate_id: input.candidateId,
      status: input.approved ? 'PASSED' : 'BLOCKED',
      news_filter_passed: true,
      session_filter_passed: true,
      spread_filter_passed: true,
      counter_trend_allowed: input.counterTrendAllowed ?? false,
      block_reasons: blockReasons,
      evaluated_at: new Date().toISOString()
    };

    // Strict schema validation
    const valRes = validatePayload('POLICY_DECISION', payload);
    if (!valRes.valid) {
      throw new Error(`PolicyDecision failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    this.reviewHistory.set(input.candidateId, payload);
    return payload;
  }

  public getDecision(candidateId: UUIDv7): PolicyDecisionPayload | undefined {
    return this.reviewHistory.get(candidateId);
  }
}
