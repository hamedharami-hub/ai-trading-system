import type { PolicyGateDecision } from "../policy/policy-gate.js";
import type {
  HistoricalReplayPlayback,
  HistoricalReplayPlaybackStatus,
} from "../replay/historical-replay-runner.js";
import type { RiskEvaluation } from "../risk/risk-engine.js";

export interface LocalPaperAssumptions {
  readonly costAssumptionsRecorded: boolean;
  readonly partialFillAssumptionsRecorded: boolean;
  readonly protectiveOrderModelAvailable: boolean;
  readonly reconciliationPlanAvailable: boolean;
}

export interface LocalPaperAdmission {
  readonly status: "NO_TRADE";
  readonly replayStatus: HistoricalReplayPlaybackStatus;
  readonly sourceKind: "REPLAY";
  readonly localOnly: true;
  readonly reasons: readonly string[];
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/**
 * Evaluates whether an offline Paper Trading lifecycle could ever begin.
 * This initial implementation is intentionally fail-closed: it creates no
 * Paper record, OrderIntent, fill, position, P&L, or external action.
 */
export function evaluateLocalPaperAdmission(
  replay: Readonly<HistoricalReplayPlayback>,
  policy: Readonly<PolicyGateDecision>,
  risk: Readonly<RiskEvaluation>,
  assumptions: Readonly<LocalPaperAssumptions>,
): LocalPaperAdmission {
  const reasons: string[] = [];

  if (replay.status !== "REPLAY_READY") {
    reasons.push("REPLAY_UNAVAILABLE");
  }
  if (!policy.approved) {
    reasons.push("POLICY_NOT_APPROVED");
  }
  if (!risk.approved || risk.approvedRiskPercent === "0") {
    reasons.push("RISK_NOT_APPROVED");
  }
  if (!assumptions.costAssumptionsRecorded) {
    reasons.push("COST_ASSUMPTIONS_MISSING");
  }
  if (!assumptions.partialFillAssumptionsRecorded) {
    reasons.push("PARTIAL_FILL_ASSUMPTIONS_MISSING");
  }
  if (!assumptions.protectiveOrderModelAvailable) {
    reasons.push("PROTECTIVE_ORDER_MODEL_UNAVAILABLE");
  }
  if (!assumptions.reconciliationPlanAvailable) {
    reasons.push("RECONCILIATION_PLAN_MISSING");
  }

  reasons.push("SIMULATED_LIFECYCLE_NOT_IMPLEMENTED");

  return Object.freeze({
    status: "NO_TRADE",
    replayStatus: replay.status,
    sourceKind: "REPLAY",
    localOnly: true,
    reasons: Object.freeze(reasons),
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
