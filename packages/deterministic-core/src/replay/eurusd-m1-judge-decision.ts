import {
  validatePayload,
  type AnalystProposalPayload,
  type CriticProposalPayload,
  type JudgeDecisionPayload,
  type StrategyCandidatePayload,
} from "@trade/contracts";

export type JudgeInvocationTrigger =
  | "A_PLUS_CANDIDATE"
  | "MATERIAL_CONFLICT"
  | "NOT_TRIGGERED";

export interface EurUsdM1JudgeInvocationCheck {
  readonly invoked: boolean;
  readonly trigger: JudgeInvocationTrigger;
  readonly bothReject: boolean;
  readonly materialConflict: boolean;
  readonly details: string;
}

export type JudgeDecisionKind =
  | "JUDGE_DECISION_EVALUATED"
  | "JUDGE_NOT_INVOKED"
  | "JUDGE_REJECTED";

export interface EurUsdM1JudgeEvaluationInput {
  readonly candidate: Readonly<StrategyCandidatePayload>;
  readonly analystProposal: Readonly<AnalystProposalPayload>;
  readonly criticProposal: Readonly<CriticProposalPayload>;
  readonly reanalysisCount?: number;
  readonly maxReanalyses?: number;
  readonly decidedAt?: string;
  readonly allowUnconditional?: boolean;
}

export interface EurUsdM1JudgeDecisionResult {
  readonly kind: JudgeDecisionKind;
  readonly decisionPayload: Readonly<JudgeDecisionPayload> | null;
  readonly trigger: JudgeInvocationTrigger;
  readonly reason: string;
  readonly reanalysisCount: number;
  readonly validationErrors: readonly string[];
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

/**
 * Deterministically checks whether the conditional Judge role must be invoked
 * according to DEC-006, DEC-048, and INV-017:
 * - Invoked for an A+ candidate (candidate.grade === "A_PLUS")
 * - Invoked for material conflict between Analyst and Critic
 * - Not invoked if both unanimously reject (both UNFAVORABLE)
 * - Not invoked if candidate is Grade A (or below) with unanimous concurrence
 */
export function shouldInvokeEurUsdM1Judge(
  candidate: Readonly<StrategyCandidatePayload>,
  analyst: Readonly<AnalystProposalPayload>,
  critic: Readonly<CriticProposalPayload>,
): EurUsdM1JudgeInvocationCheck {
  const bothReject =
    analyst.verdict === "UNFAVORABLE" && critic.verdict === "UNFAVORABLE";
  const materialConflict = analyst.verdict !== critic.verdict;
  const isAPlus = candidate.grade === "A_PLUS";

  if (bothReject) {
    return Object.freeze({
      invoked: false,
      trigger: "NOT_TRIGGERED",
      bothReject: true,
      materialConflict: false,
      details:
        "Both Analyst and Critic rejected candidate; unanimous rejection requires no Judge resolution.",
    });
  }

  if (isAPlus) {
    return Object.freeze({
      invoked: true,
      trigger: "A_PLUS_CANDIDATE",
      bothReject: false,
      materialConflict,
      details:
        "Candidate is Grade A_PLUS; Judge invocation required per DEC-006 / INV-017.",
    });
  }

  if (materialConflict) {
    return Object.freeze({
      invoked: true,
      trigger: "MATERIAL_CONFLICT",
      bothReject: false,
      materialConflict: true,
      details: `Material conflict detected: Analyst verdict is ${analyst.verdict} while Critic verdict is ${critic.verdict}.`,
    });
  }

  return Object.freeze({
    invoked: false,
    trigger: "NOT_TRIGGERED",
    bothReject: false,
    materialConflict: false,
    details:
      "No material conflict and candidate is not Grade A_PLUS; Judge invocation not required.",
  });
}

function resolveDecidedAt(
  candidate: Readonly<StrategyCandidatePayload>,
  analyst: Readonly<AnalystProposalPayload>,
  critic: Readonly<CriticProposalPayload>,
  provided?: string,
): string {
  if (
    provided &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(provided)
  ) {
    return provided;
  }
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(critic.evaluated_at)
  ) {
    return critic.evaluated_at;
  }
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(analyst.evaluated_at)
  ) {
    return analyst.evaluated_at;
  }
  return candidate.generated_at;
}

function judgeRejected(
  reason: string,
  errors: readonly string[] = [],
  trigger: JudgeInvocationTrigger = "NOT_TRIGGERED",
  reanalysisCount = 0,
): EurUsdM1JudgeDecisionResult {
  return Object.freeze({
    kind: "JUDGE_REJECTED",
    decisionPayload: null,
    trigger,
    reason,
    reanalysisCount,
    validationErrors: Object.freeze([...errors]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

/**
 * Deterministically evaluates council proposals into a schema-valid JudgeDecisionPayload
 * following DEC-006, DEC-048, DEC-080, and INV-017.
 *
 * Rules:
 * 1. Fail-closed on ID mismatch, invalid reanalysis count, or schema violation.
 * 2. If not invoked and allowUnconditional is false, returns JUDGE_NOT_INVOKED.
 * 3. Unanimous rejection or either role UNFAVORABLE -> REJECT.
 * 4. Material divergence (e.g. FAVORABLE vs NEUTRAL) -> REANALYZE (if bounded limit not reached).
 * 5. Persistent divergence beyond bounded reanalyses -> REJECT.
 * 6. High concurrence (FAVORABLE + FAVORABLE) -> APPROVE.
 * 7. Strictly analytical: executionEligible=false, orderIntentsCreated=0, externalRequestsMade=0.
 */
export function evaluateEurUsdM1JudgeDecision(
  input: EurUsdM1JudgeEvaluationInput,
): EurUsdM1JudgeDecisionResult {
  const { candidate, analystProposal, criticProposal } = input;

  // 1. Candidate ID consistency check
  if (
    candidate.candidate_id !== analystProposal.candidate_id ||
    candidate.candidate_id !== criticProposal.candidate_id
  ) {
    return judgeRejected("CANDIDATE_ID_MISMATCH", [
      "Candidate ID mismatch between StrategyCandidate, AnalystProposal, and CriticProposal",
    ]);
  }

  // 2. Validate reanalysis count
  const reanalysisCount = input.reanalysisCount ?? 0;
  if (
    typeof reanalysisCount !== "number" ||
    !Number.isInteger(reanalysisCount) ||
    reanalysisCount < 0 ||
    reanalysisCount > 2
  ) {
    return judgeRejected("INVALID_REANALYSIS_COUNT", [
      `Reanalysis count must be an integer between 0 and 2, received ${reanalysisCount}`,
    ]);
  }

  const maxReanalyses = Math.min(Math.max(input.maxReanalyses ?? 1, 1), 2);

  // 3. Invocation check
  const invocation = shouldInvokeEurUsdM1Judge(
    candidate,
    analystProposal,
    criticProposal,
  );

  if (!invocation.invoked && !input.allowUnconditional) {
    return Object.freeze({
      kind: "JUDGE_NOT_INVOKED",
      decisionPayload: null,
      trigger: invocation.trigger,
      reason: invocation.details,
      reanalysisCount,
      validationErrors: Object.freeze([]),
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // 4. Decision determination
  let decision: JudgeDecisionPayload["decision"];
  let reason: string;

  if (invocation.bothReject) {
    decision = "REJECT";
    reason =
      "Council consensus rejection: Both Analyst and Critic issued UNFAVORABLE proposals.";
  } else if (analystProposal.verdict === "UNFAVORABLE") {
    decision = "REJECT";
    reason = `Judge rejection: Analyst proposal is UNFAVORABLE (${analystProposal.notes}). Insufficient structural confluence.`;
  } else if (criticProposal.verdict === "UNFAVORABLE") {
    decision = "REJECT";
    reason = `Judge rejection: Critic proposal is UNFAVORABLE (${criticProposal.notes}). Critical adverse risk or invalidation threat.`;
  } else if (
    analystProposal.verdict === "FAVORABLE" &&
    criticProposal.verdict === "FAVORABLE"
  ) {
    decision = "APPROVE";
    reason = `Judge approval: Council concurrence achieved. Both Analyst and Critic issued FAVORABLE proposals for candidate ${candidate.candidate_id} (${candidate.grade}).`;
  } else if (
    (analystProposal.verdict === "FAVORABLE" &&
      criticProposal.verdict === "NEUTRAL") ||
    (analystProposal.verdict === "NEUTRAL" &&
      criticProposal.verdict === "FAVORABLE")
  ) {
    if (reanalysisCount < maxReanalyses) {
      decision = "REANALYZE";
      reason = `Judge reanalysis requested: Material council divergence (Analyst: ${analystProposal.verdict}, Critic: ${criticProposal.verdict}). Bounded reanalysis (${reanalysisCount + 1}/${maxReanalyses}) triggered to evaluate context.`;
    } else {
      decision = "REJECT";
      reason = `Judge rejection: Material council divergence persisted after maximum allowed reanalyses (${reanalysisCount}/${maxReanalyses}). Failing closed to REJECT per DEC-048.`;
    }
  } else {
    // Unanimous NEUTRAL or unhandled divergence fails closed
    decision = "REJECT";
    reason = `Judge rejection: Ambiguous council proposals (Analyst: ${analystProposal.verdict}, Critic: ${criticProposal.verdict}). Failing closed per DEC-006.`;
  }

  const decidedAt = resolveDecidedAt(
    candidate,
    analystProposal,
    criticProposal,
    input.decidedAt,
  );

  const payload: JudgeDecisionPayload = {
    candidate_id: candidate.candidate_id,
    decision,
    reason,
    reanalysis_count: reanalysisCount,
    decided_at: decidedAt,
  };

  const validation = validatePayload("JUDGE_DECISION", payload);
  if (!validation.valid) {
    return judgeRejected(
      "SCHEMA_VALIDATION_FAILED",
      validation.errors ?? ["SCHEMA_VALIDATION_FAILED"],
      invocation.trigger,
      reanalysisCount,
    );
  }

  return Object.freeze({
    kind: "JUDGE_DECISION_EVALUATED",
    decisionPayload: Object.freeze(payload),
    trigger: invocation.trigger,
    reason,
    reanalysisCount,
    validationErrors: Object.freeze([]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
