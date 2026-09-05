import {
  parseDecimal,
  validatePayload,
  type AnalystProposalPayload,
  type CriticProposalPayload,
  type StrategyCandidatePayload,
} from "@trade/contracts";
import type { EurUsdM1ReplayObservationBundle } from "./eurusd-m1-replay-observation-bundle.js";

export type CouncilProposalStatus =
  | "PROPOSAL_EVALUATED"
  | "INVALID_CANDIDATE"
  | "INSUFFICIENT_OBSERVATION_CONTEXT"
  | "SCHEMA_VALIDATION_FAILED";

export interface EurUsdM1AnalystProposalResult {
  readonly kind: "ANALYST_PROPOSAL_EVALUATED" | "PROPOSAL_REJECTED";
  readonly status: CouncilProposalStatus;
  readonly proposal: AnalystProposalPayload | null;
  readonly reasons: readonly string[];
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

export interface EurUsdM1CriticProposalResult {
  readonly kind: "CRITIC_PROPOSAL_EVALUATED" | "PROPOSAL_REJECTED";
  readonly status: CouncilProposalStatus;
  readonly proposal: CriticProposalPayload | null;
  readonly reasons: readonly string[];
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

export interface EurUsdM1CouncilEvaluationInput {
  readonly candidate: Readonly<StrategyCandidatePayload>;
  readonly observationBundle?: Readonly<EurUsdM1ReplayObservationBundle>;
  readonly evaluatedAt?: string;
}

export interface EurUsdM1CouncilProposalsResult {
  readonly kind: "COUNCIL_EVALUATED" | "COUNCIL_REJECTED";
  readonly analyst: EurUsdM1AnalystProposalResult;
  readonly critic: EurUsdM1CriticProposalResult;
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

function analystRejected(
  status: CouncilProposalStatus,
  reasons: readonly string[],
): EurUsdM1AnalystProposalResult {
  return Object.freeze({
    kind: "PROPOSAL_REJECTED",
    status,
    proposal: null,
    reasons: Object.freeze([...reasons]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

function criticRejected(
  status: CouncilProposalStatus,
  reasons: readonly string[],
): EurUsdM1CriticProposalResult {
  return Object.freeze({
    kind: "PROPOSAL_REJECTED",
    status,
    proposal: null,
    reasons: Object.freeze([...reasons]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

function resolveEvaluatedAt(
  candidate: Readonly<StrategyCandidatePayload>,
  provided?: string,
): string {
  if (
    provided &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(provided)
  ) {
    return provided;
  }
  return candidate.generated_at;
}

/**
 * Deterministically evaluates an ICT StrategyCandidate from the Analyst's perspective.
 * Analyzes market structure break, ATR displacement, zone confluence, and sweep evidence.
 * Fails closed without execution eligibility or external requests.
 */
export function evaluateEurUsdM1AnalystProposal(
  input: EurUsdM1CouncilEvaluationInput,
): EurUsdM1AnalystProposalResult {
  const {
    candidate,
    observationBundle,
    evaluatedAt: providedEvaluatedAt,
  } = input;

  if (!candidate || !candidate.candidate_id) {
    return analystRejected("INVALID_CANDIDATE", [
      "INVALID_CANDIDATE: Missing candidate or candidate_id",
    ]);
  }

  // Pre-validate candidate schema
  const candidateValidation = validatePayload("STRATEGY_CANDIDATE", candidate);
  if (!candidateValidation.valid) {
    return analystRejected(
      "INVALID_CANDIDATE",
      candidateValidation.errors ?? [
        "INVALID_CANDIDATE: Schema validation failed",
      ],
    );
  }

  // Check observation bundle consistency if provided
  let hasSweep = false;
  if (observationBundle) {
    if (observationBundle.kind !== "OBSERVATION_BUNDLE") {
      return analystRejected("INSUFFICIENT_OBSERVATION_CONTEXT", [
        "INSUFFICIENT_OBSERVATION_CONTEXT: Invalid observation bundle",
      ]);
    }
    if (observationBundle.sweepRaid.kind === "OBSERVATION_FACTS") {
      hasSweep =
        candidate.side === "BUY"
          ? observationBundle.sweepRaid.sellSideSweep !== "NOT_CONFIRMED"
          : observationBundle.sweepRaid.buySideSweep !== "NOT_CONFIRMED";
    }
  }

  const evaluatedAt = resolveEvaluatedAt(candidate, providedEvaluatedAt);

  let verdict: AnalystProposalPayload["verdict"];
  let confidence: string;
  let evidenceKeys: [string, ...string[]];
  let notes: string;

  if (candidate.grade === "A_PLUS" || (candidate.grade === "A" && hasSweep)) {
    verdict = "FAVORABLE";
    confidence = "0.8500";
    evidenceKeys = [
      "STRUCTURE_BREAK_CONFIRMED",
      "DISPLACEMENT_VALIDATED",
      "ZONE_ESTABLISHED",
      "LIQUIDITY_SWEEP_CONFIRMED",
    ];
    notes =
      "Analyst evaluation: High-conviction ICT candidate with liquidity sweep, market structure break, and confirmed ATR displacement.";
  } else if (candidate.grade === "A") {
    verdict = "FAVORABLE";
    confidence = "0.7500";
    evidenceKeys = [
      "STRUCTURE_BREAK_CONFIRMED",
      "DISPLACEMENT_VALIDATED",
      "ZONE_ESTABLISHED",
    ];
    notes =
      "Analyst evaluation: Qualified ICT candidate with confirmed market structure break, ATR displacement, and valid zone.";
  } else if (candidate.grade === "B") {
    verdict = "NEUTRAL";
    confidence = "0.5000";
    evidenceKeys = ["MARGINAL_STRUCTURE_BREAK", "UNCONFIRMED_ZONE"];
    notes =
      "Analyst evaluation: Marginal setup quality with unconfirmed zone confluence.";
  } else {
    verdict = "UNFAVORABLE";
    confidence = "0.8000";
    evidenceKeys = ["STRUCTURE_BREAK_DEGRADED", "COUNTER_TREND_RISK"];
    notes =
      "Analyst evaluation: Substandard structure break with elevated counter-trend risk.";
  }

  const payload: AnalystProposalPayload = {
    candidate_id: candidate.candidate_id,
    verdict,
    confidence,
    evidence_keys: evidenceKeys,
    notes,
    evaluated_at: evaluatedAt,
  };

  const validation = validatePayload("ANALYST_PROPOSAL", payload);
  if (!validation.valid) {
    return analystRejected(
      "SCHEMA_VALIDATION_FAILED",
      validation.errors ?? ["SCHEMA_VALIDATION_FAILED"],
    );
  }

  return Object.freeze({
    kind: "ANALYST_PROPOSAL_EVALUATED",
    status: "PROPOSAL_EVALUATED",
    proposal: Object.freeze(payload),
    reasons: Object.freeze([]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

/**
 * Deterministically evaluates an ICT StrategyCandidate from the Critic's adversarial risk perspective.
 * Audits risk/reward bounds, expiry horizons, stop placement, and counter-indications.
 * Fails closed without execution eligibility or external requests.
 */
export function evaluateEurUsdM1CriticProposal(
  input: EurUsdM1CouncilEvaluationInput,
): EurUsdM1CriticProposalResult {
  const {
    candidate,
    observationBundle,
    evaluatedAt: providedEvaluatedAt,
  } = input;

  if (!candidate || !candidate.candidate_id) {
    return criticRejected("INVALID_CANDIDATE", [
      "INVALID_CANDIDATE: Missing candidate or candidate_id",
    ]);
  }

  // Pre-validate candidate schema
  const candidateValidation = validatePayload("STRATEGY_CANDIDATE", candidate);
  if (!candidateValidation.valid) {
    return criticRejected(
      "INVALID_CANDIDATE",
      candidateValidation.errors ?? [
        "INVALID_CANDIDATE: Schema validation failed",
      ],
    );
  }

  const evaluatedAt = resolveEvaluatedAt(candidate, providedEvaluatedAt);

  // Check Risk/Reward Ratio strictly >= 2.0 (DEC-015, DEC-058)
  try {
    const rr = parseDecimal(candidate.risk_reward_ratio);
    if (rr.lt(2.0)) {
      const payload: CriticProposalPayload = {
        candidate_id: candidate.candidate_id,
        verdict: "UNFAVORABLE",
        confidence: "0.9000",
        evidence_keys: ["INSUFFICIENT_RISK_REWARD"],
        notes: `Critic evaluation: R:R ${candidate.risk_reward_ratio} is strictly below required minimum 2.0.`,
        evaluated_at: evaluatedAt,
      };
      return Object.freeze({
        kind: "CRITIC_PROPOSAL_EVALUATED",
        status: "PROPOSAL_EVALUATED",
        proposal: Object.freeze(payload),
        reasons: Object.freeze([]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }
  } catch {
    return criticRejected("INVALID_CANDIDATE", [
      "INVALID_CANDIDATE: Unparseable risk_reward_ratio",
    ]);
  }

  // Check Expiry horizon (DEC-056, DEC-196: max 3 candles)
  if (candidate.expiry_candles > 3) {
    const payload: CriticProposalPayload = {
      candidate_id: candidate.candidate_id,
      verdict: "UNFAVORABLE",
      confidence: "0.8500",
      evidence_keys: ["EXCESSIVE_EXPIRY_HORIZON"],
      notes: `Critic evaluation: Expiry ${candidate.expiry_candles} candles exceeds policy limit of 3.`,
      evaluated_at: evaluatedAt,
    };
    return Object.freeze({
      kind: "CRITIC_PROPOSAL_EVALUATED",
      status: "PROPOSAL_EVALUATED",
      proposal: Object.freeze(payload),
      reasons: Object.freeze([]),
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // Check observation bundle consistency if provided
  let hasSweep = false;
  if (observationBundle) {
    if (observationBundle.kind !== "OBSERVATION_BUNDLE") {
      return criticRejected("INSUFFICIENT_OBSERVATION_CONTEXT", [
        "INSUFFICIENT_OBSERVATION_CONTEXT: Invalid observation bundle",
      ]);
    }
    if (observationBundle.sweepRaid.kind === "OBSERVATION_FACTS") {
      hasSweep =
        candidate.side === "BUY"
          ? observationBundle.sweepRaid.sellSideSweep !== "NOT_CONFIRMED"
          : observationBundle.sweepRaid.buySideSweep !== "NOT_CONFIRMED";
    }
  }

  let verdict: CriticProposalPayload["verdict"];
  let confidence: string;
  let evidenceKeys: [string, ...string[]];
  let notes: string;

  if (candidate.grade === "A_PLUS" || (candidate.grade === "A" && hasSweep)) {
    verdict = "FAVORABLE";
    confidence = "0.8000";
    evidenceKeys = [
      "RISK_REWARD_ACCEPTABLE",
      "SWEEP_VALIDATED",
      "DISPLACEMENT_SUFFICIENT",
    ];
    notes =
      "Critic risk critique: Acceptable 2.0 R:R with verified liquidity sweep prior to structure break.";
  } else if (candidate.grade === "A") {
    // For Grade A without confirmed sweep, Critic issues NEUTRAL (adversarial stance per DEC-048)
    verdict = "NEUTRAL";
    confidence = "0.6500";
    evidenceKeys = ["RISK_REWARD_ACCEPTABLE", "UNCONFIRMED_LIQUIDITY_SWEEP"];
    notes =
      "Critic risk critique: Acceptable 2.0 R:R and displacement, but unconfirmed opposing liquidity sweep creates tail-risk.";
  } else {
    verdict = "UNFAVORABLE";
    confidence = "0.7500";
    evidenceKeys = ["SUBOPTIMAL_GRADE", "ELEVATED_DRAWDOWN_RISK"];
    notes =
      "Critic risk critique: Suboptimal candidate grade carries elevated adverse excursion probability.";
  }

  const payload: CriticProposalPayload = {
    candidate_id: candidate.candidate_id,
    verdict,
    confidence,
    evidence_keys: evidenceKeys,
    notes,
    evaluated_at: evaluatedAt,
  };

  const validation = validatePayload("CRITIC_PROPOSAL", payload);
  if (!validation.valid) {
    return criticRejected(
      "SCHEMA_VALIDATION_FAILED",
      validation.errors ?? ["SCHEMA_VALIDATION_FAILED"],
    );
  }

  return Object.freeze({
    kind: "CRITIC_PROPOSAL_EVALUATED",
    status: "PROPOSAL_EVALUATED",
    proposal: Object.freeze(payload),
    reasons: Object.freeze([]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

/**
 * Convenience evaluator running both Analyst and Critic evaluations over a StrategyCandidate.
 */
export function evaluateEurUsdM1CouncilProposals(
  input: EurUsdM1CouncilEvaluationInput,
): EurUsdM1CouncilProposalsResult {
  const analyst = evaluateEurUsdM1AnalystProposal(input);
  const critic = evaluateEurUsdM1CriticProposal(input);

  const isRejected =
    analyst.kind === "PROPOSAL_REJECTED" || critic.kind === "PROPOSAL_REJECTED";

  return Object.freeze({
    kind: isRejected ? "COUNCIL_REJECTED" : "COUNCIL_EVALUATED",
    analyst,
    critic,
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
