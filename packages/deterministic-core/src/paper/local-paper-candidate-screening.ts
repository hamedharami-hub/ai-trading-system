import {
  evaluatePolicyGate,
  type PolicyGateDecision,
  type PolicyGateInput,
} from "../policy/policy-gate.js";
import {
  evaluateRisk,
  type RiskEvaluation,
  type RiskEvaluationInput,
} from "../risk/risk-engine.js";

export interface LocalPaperCandidateScreeningInput {
  readonly policy: Readonly<PolicyGateInput>;
  readonly risk: Readonly<Omit<RiskEvaluationInput, "policyApproved">>;
}

export interface LocalPaperCandidateScreeningResult {
  readonly status: "NO_TRADE";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly reasons: readonly string[];
  readonly policy: PolicyGateDecision;
  readonly risk: RiskEvaluation;
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly persistenceMutations: 0;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/**
 * Evaluates local PolicyGate and Risk inputs without admitting an entry. Risk
 * receives policy approval only from the deterministic PolicyGate, never from
 * caller input. Even a fully approved screening result remains NO_TRADE.
 */
export function screenLocalPaperCandidate(
  input: Readonly<LocalPaperCandidateScreeningInput>,
): LocalPaperCandidateScreeningResult {
  const policy = evaluatePolicyGate(input.policy);
  const risk = evaluateRisk({ ...input.risk, policyApproved: policy.approved });

  return Object.freeze({
    status: "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    reasons: Object.freeze([
      ...policy.reasons,
      ...risk.reasons,
      "SIMULATED_LIFECYCLE_NOT_IMPLEMENTED",
    ]),
    policy,
    risk,
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    persistenceMutations: 0,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
