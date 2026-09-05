import {
  validatePayload,
  type AnalystProposalPayload,
  type CriticProposalPayload,
  type JudgeDecisionPayload,
  type OrderIntentPayload,
  type StrategyCandidatePayload,
} from "@trade/contracts";
import {
  evaluateEurUsdM1StrategyCandidate,
  createDeterministicUuidV7,
  type EurUsdM1StrategyCandidateInput,
  type EurUsdM1StrategyCandidateReport,
} from "./eurusd-m1-strategy-candidate-evaluator.js";
import {
  evaluateEurUsdM1CouncilProposals,
  type EurUsdM1CouncilProposalsResult,
} from "./eurusd-m1-council-proposals.js";
import {
  evaluateEurUsdM1JudgeDecision,
  shouldInvokeEurUsdM1Judge,
  type EurUsdM1JudgeDecisionResult,
} from "./eurusd-m1-judge-decision.js";
import {
  evaluatePolicyGate,
  type PolicyGateDecision,
  type PolicyGateInput,
} from "../policy/policy-gate.js";
import {
  evaluateRisk,
  type RiskEvaluation,
  type RiskEvaluationInput,
  type RiskTier,
} from "../risk/risk-engine.js";
import {
  createRiskApprovedOrderIntent,
  type OrderIntentRequest,
} from "../orders/order-intent-factory.js";
import type { EurUsdM1ReplayObservationBundle } from "./eurusd-m1-replay-observation-bundle.js";

export type PipelineStage =
  | "CANDIDATE"
  | "COUNCIL"
  | "JUDGE"
  | "POLICY"
  | "RISK"
  | "ORDER_INTENT"
  | "COMPLETE";

export type PipelineTerminalStatus =
  | "CANDIDATE_REJECTED"
  | "COUNCIL_REJECTED"
  | "JUDGE_REJECTED"
  | "JUDGE_REANALYSIS_REQUIRED"
  | "POLICY_REJECTED"
  | "RISK_REJECTED"
  | "ANALYSIS_COMPLETE"
  | "ORDER_INTENT_FORMED";

export interface EurUsdM1ReplayPipelineInput {
  readonly candidateInput?: EurUsdM1StrategyCandidateInput;
  readonly candidatePayload?: Readonly<StrategyCandidatePayload>;
  readonly observationBundle?: Readonly<EurUsdM1ReplayObservationBundle>;
  readonly analystProposalOverride?: Readonly<Partial<AnalystProposalPayload>>;
  readonly criticProposalOverride?: Readonly<Partial<CriticProposalPayload>>;
  readonly reanalysisCount?: number;
  readonly maxReanalyses?: number;
  readonly policyOverrides?: Readonly<Partial<PolicyGateInput>>;
  readonly riskOverrides?: Readonly<Partial<RiskEvaluationInput>>;
  readonly orderIntentConfig?: Readonly<{
    intentId?: string;
    idempotencyKey?: string;
    quantity?: string;
    timeInForce?: OrderIntentPayload["time_in_force"];
  }>;
  readonly allowOrderIntentGeneration?: boolean;
}

export interface EurUsdM1ReplayPipelineResult {
  readonly status: PipelineTerminalStatus;
  readonly stoppedAtStage: PipelineStage;
  readonly candidate: Readonly<StrategyCandidatePayload> | null;
  readonly candidateResult: Readonly<EurUsdM1StrategyCandidateReport> | null;
  readonly councilResult: Readonly<EurUsdM1CouncilProposalsResult> | null;
  readonly analystProposal: Readonly<AnalystProposalPayload> | null;
  readonly criticProposal: Readonly<CriticProposalPayload> | null;
  readonly judgeInvoked: boolean;
  readonly judgeResult: Readonly<EurUsdM1JudgeDecisionResult> | null;
  readonly judgeDecision: Readonly<JudgeDecisionPayload> | null;
  readonly policyGateDecision: Readonly<PolicyGateDecision> | null;
  readonly riskDecision: Readonly<RiskEvaluation> | null;
  readonly orderIntent: Readonly<OrderIntentPayload> | null;
  readonly reasons: readonly string[];
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0 | 1;
  readonly externalRequestsMade: 0;
}

/**
 * Runs the integrated deterministic offline replay pipeline combining:
 * 1. StrategyCandidate evaluation (Grade A/A+, fixed 2.0 R:R, 3-candle expiry)
 * 2. Council Proposals evaluation (Analyst + Critic independent review)
 * 3. Judge Decision evaluation (Conditional on Grade A+ or material conflict, bounded reanalysis)
 * 4. Deterministic PolicyGate evaluation
 * 5. Deterministic RiskEngine evaluation
 * 6. Optional risk-approved OrderIntent creation in controlled test fixtures
 *
 * In accordance with DEC-006, DEC-048, DEC-080, DEC-260, DEC-262, and DEC-264:
 * - Operates entirely locally and offline
 * - Guaranteed fail-closed on any validation or policy denial
 * - Execution is strictly disabled (executionEligible=false, externalRequestsMade=0)
 */
export function runEurUsdM1ReplayPipeline(
  input: EurUsdM1ReplayPipelineInput,
): EurUsdM1ReplayPipelineResult {
  let candidate: Readonly<StrategyCandidatePayload> | null = null;
  let candidateResult: Readonly<EurUsdM1StrategyCandidateReport> | null = null;

  // 1. Candidate Stage
  if (input.candidatePayload) {
    const validation = validatePayload(
      "STRATEGY_CANDIDATE",
      input.candidatePayload,
    );
    if (!validation.valid) {
      return Object.freeze({
        status: "CANDIDATE_REJECTED",
        stoppedAtStage: "CANDIDATE",
        candidate: null,
        candidateResult: null,
        councilResult: null,
        analystProposal: null,
        criticProposal: null,
        judgeInvoked: false,
        judgeResult: null,
        judgeDecision: null,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze(validation.errors ?? ["INVALID_CANDIDATE_PAYLOAD"]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }
    candidate = input.candidatePayload;
  } else if (input.candidateInput) {
    candidateResult = evaluateEurUsdM1StrategyCandidate(input.candidateInput);
    if (
      candidateResult.kind !== "CANDIDATE_EVALUATED" ||
      !candidateResult.candidate
    ) {
      return Object.freeze({
        status: "CANDIDATE_REJECTED",
        stoppedAtStage: "CANDIDATE",
        candidate: null,
        candidateResult,
        councilResult: null,
        analystProposal: null,
        criticProposal: null,
        judgeInvoked: false,
        judgeResult: null,
        judgeDecision: null,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze(candidateResult.reasons),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }
    candidate = candidateResult.candidate;
  } else {
    return Object.freeze({
      status: "CANDIDATE_REJECTED",
      stoppedAtStage: "CANDIDATE",
      candidate: null,
      candidateResult: null,
      councilResult: null,
      analystProposal: null,
      criticProposal: null,
      judgeInvoked: false,
      judgeResult: null,
      judgeDecision: null,
      policyGateDecision: null,
      riskDecision: null,
      orderIntent: null,
      reasons: Object.freeze(["NO_CANDIDATE_INPUT_PROVIDED"]),
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // Type narrowing check
  if (!candidate) {
    return Object.freeze({
      status: "CANDIDATE_REJECTED",
      stoppedAtStage: "CANDIDATE",
      candidate: null,
      candidateResult,
      councilResult: null,
      analystProposal: null,
      criticProposal: null,
      judgeInvoked: false,
      judgeResult: null,
      judgeDecision: null,
      policyGateDecision: null,
      riskDecision: null,
      orderIntent: null,
      reasons: Object.freeze(["CANDIDATE_EMPTY"]),
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // 2. Council Proposals Stage
  const councilResult = evaluateEurUsdM1CouncilProposals({
    candidate,
    ...(input.observationBundle
      ? { observationBundle: input.observationBundle }
      : {}),
  });

  if (
    councilResult.kind !== "COUNCIL_EVALUATED" ||
    !councilResult.analyst.proposal ||
    !councilResult.critic.proposal
  ) {
    const reasons = [
      ...councilResult.analyst.reasons,
      ...councilResult.critic.reasons,
    ];
    return Object.freeze({
      status: "COUNCIL_REJECTED",
      stoppedAtStage: "COUNCIL",
      candidate,
      candidateResult,
      councilResult,
      analystProposal: councilResult.analyst.proposal,
      criticProposal: councilResult.critic.proposal,
      judgeInvoked: false,
      judgeResult: null,
      judgeDecision: null,
      policyGateDecision: null,
      riskDecision: null,
      orderIntent: null,
      reasons: Object.freeze(reasons.length > 0 ? reasons : ["COUNCIL_PROPOSALS_REJECTED"]),
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  const analystProposal: Readonly<AnalystProposalPayload> =
    input.analystProposalOverride
      ? Object.freeze({
          ...councilResult.analyst.proposal,
          ...input.analystProposalOverride,
        })
      : councilResult.analyst.proposal;
  const criticProposal: Readonly<CriticProposalPayload> =
    input.criticProposalOverride
      ? Object.freeze({
          ...councilResult.critic.proposal,
          ...input.criticProposalOverride,
        })
      : councilResult.critic.proposal;

  // 3. Judge Stage
  const invocation = shouldInvokeEurUsdM1Judge(
    candidate,
    analystProposal,
    criticProposal,
  );

  let judgeResult: Readonly<EurUsdM1JudgeDecisionResult> | null = null;
  let judgeDecision: Readonly<JudgeDecisionPayload> | null = null;

  if (invocation.invoked) {
    judgeResult = evaluateEurUsdM1JudgeDecision({
      candidate,
      analystProposal,
      criticProposal,
      ...(input.reanalysisCount !== undefined
        ? { reanalysisCount: input.reanalysisCount }
        : {}),
      ...(input.maxReanalyses !== undefined
        ? { maxReanalyses: input.maxReanalyses }
        : {}),
    });

    if (
      judgeResult.kind === "JUDGE_REJECTED" ||
      !judgeResult.decisionPayload
    ) {
      return Object.freeze({
        status: "JUDGE_REJECTED",
        stoppedAtStage: "JUDGE",
        candidate,
        candidateResult,
        councilResult,
        analystProposal,
        criticProposal,
        judgeInvoked: true,
        judgeResult,
        judgeDecision: null,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze([judgeResult.reason, ...judgeResult.validationErrors]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }

    judgeDecision = judgeResult.decisionPayload;

    if (judgeDecision.decision === "REANALYZE") {
      return Object.freeze({
        status: "JUDGE_REANALYSIS_REQUIRED",
        stoppedAtStage: "JUDGE",
        candidate,
        candidateResult,
        councilResult,
        analystProposal,
        criticProposal,
        judgeInvoked: true,
        judgeResult,
        judgeDecision,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze([judgeResult.reason]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }

    if (judgeDecision.decision === "REJECT") {
      return Object.freeze({
        status: "JUDGE_REJECTED",
        stoppedAtStage: "JUDGE",
        candidate,
        candidateResult,
        councilResult,
        analystProposal,
        criticProposal,
        judgeInvoked: true,
        judgeResult,
        judgeDecision,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze([judgeResult.reason]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }
  } else {
    // Unanimous council rejection without judge invocation
    if (invocation.bothReject) {
      return Object.freeze({
        status: "COUNCIL_REJECTED",
        stoppedAtStage: "COUNCIL",
        candidate,
        candidateResult,
        councilResult,
        analystProposal,
        criticProposal,
        judgeInvoked: false,
        judgeResult: null,
        judgeDecision: null,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze([
          "COUNCIL_UNANIMOUS_REJECTION: Both Analyst and Critic issued UNFAVORABLE proposals",
        ]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }

    // Unanimous approval check for non-A+ candidates
    if (
      analystProposal.verdict !== "FAVORABLE" ||
      criticProposal.verdict !== "FAVORABLE"
    ) {
      return Object.freeze({
        status: "COUNCIL_REJECTED",
        stoppedAtStage: "COUNCIL",
        candidate,
        candidateResult,
        councilResult,
        analystProposal,
        criticProposal,
        judgeInvoked: false,
        judgeResult: null,
        judgeDecision: null,
        policyGateDecision: null,
        riskDecision: null,
        orderIntent: null,
        reasons: Object.freeze([
          "COUNCIL_APPROVAL_MISSING: Analytical concurrence not achieved",
        ]),
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }
  }

  // 4. Policy Gate Stage
  const policyInput: PolicyGateInput = {
    dataHealth: input.policyOverrides?.dataHealth ?? "GREEN",
    sessionPermitted: input.policyOverrides?.sessionPermitted ?? true,
    newsBlackout: input.policyOverrides?.newsBlackout ?? false,
    candidateValid: input.policyOverrides?.candidateValid ?? true,
    candidateExpired: input.policyOverrides?.candidateExpired ?? false,
    analyticalConflict: invocation.materialConflict,
    judgeRequired: invocation.invoked,
    ...(judgeDecision ? { judgeDecision: judgeDecision.decision } : {}),
    ...input.policyOverrides,
  };

  const policyGateDecision = evaluatePolicyGate(policyInput);

  if (!policyGateDecision.approved) {
    return Object.freeze({
      status: "POLICY_REJECTED",
      stoppedAtStage: "POLICY",
      candidate,
      candidateResult,
      councilResult,
      analystProposal,
      criticProposal,
      judgeInvoked: invocation.invoked,
      judgeResult,
      judgeDecision,
      policyGateDecision,
      riskDecision: null,
      orderIntent: null,
      reasons: policyGateDecision.reasons,
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // 5. Risk Engine Stage
  const tier: RiskTier =
    input.riskOverrides?.tier ??
    (candidate.grade === "A_PLUS" ? "A_PLUS" : "A");

  const riskInput: RiskEvaluationInput = {
    tier,
    policyApproved: policyGateDecision.approved,
    netRiskReward: "2.0",
    dailyLossPercent: input.riskOverrides?.dailyLossPercent ?? "0",
    drawdownPercent: input.riskOverrides?.drawdownPercent ?? "0",
    currentOpenRiskPercent: input.riskOverrides?.currentOpenRiskPercent ?? "0",
    correlationOpenRiskPercent:
      input.riskOverrides?.correlationOpenRiskPercent ?? "0",
    concurrentPositions: input.riskOverrides?.concurrentPositions ?? 0,
    counterTrend: input.riskOverrides?.counterTrend ?? false,
    executionMode: input.riskOverrides?.executionMode ?? "ANALYSIS_ONLY",
    eliteConditionsPassed: input.riskOverrides?.eliteConditionsPassed ?? false,
    ...input.riskOverrides,
  };

  const riskDecision = evaluateRisk(riskInput);

  // In ANALYSIS_ONLY mode, evaluateRisk naturally fails closed with "ANALYSIS_ONLY"
  if (riskInput.executionMode === "ANALYSIS_ONLY") {
    return Object.freeze({
      status: "ANALYSIS_COMPLETE",
      stoppedAtStage: "COMPLETE",
      candidate,
      candidateResult,
      councilResult,
      analystProposal,
      criticProposal,
      judgeInvoked: invocation.invoked,
      judgeResult,
      judgeDecision,
      policyGateDecision,
      riskDecision,
      orderIntent: null,
      reasons: riskDecision.reasons,
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // Non-ANALYSIS_ONLY execution modes (e.g. MANUAL_CONFIRM in test fixtures)
  if (!riskDecision.approved) {
    return Object.freeze({
      status: "RISK_REJECTED",
      stoppedAtStage: "RISK",
      candidate,
      candidateResult,
      councilResult,
      analystProposal,
      criticProposal,
      judgeInvoked: invocation.invoked,
      judgeResult,
      judgeDecision,
      policyGateDecision,
      riskDecision,
      orderIntent: null,
      reasons: riskDecision.reasons,
      executionEligible: false,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  // 6. OrderIntent Formation (if explicitly requested in fixture)
  let orderIntent: Readonly<OrderIntentPayload> | null = null;

  if (input.allowOrderIntentGeneration) {
    const timestampMs = Date.parse(candidate.generated_at);
    const intentRequest: OrderIntentRequest = {
      intentId:
        input.orderIntentConfig?.intentId ??
        createDeterministicUuidV7(
          Number.isFinite(timestampMs) ? timestampMs : 1725148800000,
          999,
        ),
      candidateId: candidate.candidate_id,
      idempotencyKey:
        input.orderIntentConfig?.idempotencyKey ??
        createDeterministicUuidV7(
          Number.isFinite(timestampMs) ? timestampMs : 1725148800000,
          998,
        ),
      symbol: candidate.symbol,
      side: candidate.side,
      orderType: "LIMIT",
      quantity: input.orderIntentConfig?.quantity ?? "10000",
      limitPrice: candidate.entry_price,
      stopLossPrice: candidate.invalidation_price,
      takeProfitPrice: candidate.target_price,
      timeInForce: input.orderIntentConfig?.timeInForce ?? "GTC",
      createdAt: candidate.generated_at,
    };

    orderIntent = createRiskApprovedOrderIntent(
      intentRequest,
      policyGateDecision,
      riskDecision,
    );

    return Object.freeze({
      status: "ORDER_INTENT_FORMED",
      stoppedAtStage: "ORDER_INTENT",
      candidate,
      candidateResult,
      councilResult,
      analystProposal,
      criticProposal,
      judgeInvoked: invocation.invoked,
      judgeResult,
      judgeDecision,
      policyGateDecision,
      riskDecision,
      orderIntent,
      reasons: Object.freeze(["ORDER_INTENT_FORMED_SUCCESSFULLY"]),
      executionEligible: false,
      orderIntentsCreated: 1,
      externalRequestsMade: 0,
    });
  }

  return Object.freeze({
    status: "ANALYSIS_COMPLETE",
    stoppedAtStage: "COMPLETE",
    candidate,
    candidateResult,
    councilResult,
    analystProposal,
    criticProposal,
    judgeInvoked: invocation.invoked,
    judgeResult,
    judgeDecision,
    policyGateDecision,
    riskDecision,
    orderIntent: null,
    reasons: Object.freeze(["PIPELINE_EVALUATION_COMPLETE"]),
    executionEligible: false,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
