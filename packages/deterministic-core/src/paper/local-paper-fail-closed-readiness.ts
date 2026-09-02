import type { LocalPaperLifecycleState } from "./local-paper-lifecycle.js";

export interface LocalPaperReadinessInput {
  readonly replayEvidenceId: string | undefined;
  readonly assumptionEvidenceId: string | undefined;
  readonly protectiveHandlingEvidenceId: string | undefined;
  readonly reconciliationEvidenceId: string | undefined;
  readonly lifecycleStates: readonly string[];
}

export interface LocalPaperReadinessResult {
  readonly status: "NO_TRADE" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly reasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

const TRANSITIONS: Readonly<
  Record<LocalPaperLifecycleState, readonly LocalPaperLifecycleState[]>
> = {
  DRAFT: ["POLICY_ALLOWED", "NO_TRADE", "CANCELLED", "REJECTED"],
  POLICY_ALLOWED: ["RISK_APPROVED", "NO_TRADE", "CANCELLED", "REJECTED"],
  RISK_APPROVED: ["INTENT_CREATED", "NO_TRADE", "CANCELLED", "REJECTED"],
  INTENT_CREATED: ["NO_TRADE", "CANCELLED", "REJECTED"],
  NO_TRADE: [],
  CANCELLED: [],
  REJECTED: [],
};

function hasId(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function isKnownState(value: string): value is LocalPaperLifecycleState {
  return Object.hasOwn(TRANSITIONS, value);
}

/** Validates readiness only. It cannot create or advance a simulated entry. */
export function evaluateLocalPaperFailClosedReadiness(
  input: Readonly<LocalPaperReadinessInput>,
): LocalPaperReadinessResult {
  const reasons: string[] = [];
  if (!hasId(input.replayEvidenceId)) reasons.push("REPLAY_EVIDENCE_MISSING");
  if (!hasId(input.assumptionEvidenceId))
    reasons.push("ASSUMPTION_EVIDENCE_MISSING");
  if (!hasId(input.protectiveHandlingEvidenceId))
    reasons.push("PROTECTIVE_HANDLING_EVIDENCE_MISSING");
  if (!hasId(input.reconciliationEvidenceId))
    reasons.push("RECONCILIATION_EVIDENCE_MISSING");
  if (input.lifecycleStates.length === 0)
    reasons.push("LIFECYCLE_EVIDENCE_MISSING");
  for (let index = 0; index < input.lifecycleStates.length; index += 1) {
    const current = input.lifecycleStates[index];
    const next = input.lifecycleStates[index + 1];
    if (current === undefined || !isKnownState(current)) {
      reasons.push("LIFECYCLE_STATE_UNKNOWN");
      continue;
    }
    const currentState: LocalPaperLifecycleState = current;
    if (next !== undefined && !isKnownState(next)) {
      reasons.push("LIFECYCLE_TRANSITION_INVALID");
      continue;
    }
    if (
      next !== undefined &&
      !TRANSITIONS[currentState].includes(next as LocalPaperLifecycleState)
    ) {
      reasons.push("LIFECYCLE_TRANSITION_INVALID");
    }
  }
  if (reasons.length === 0) reasons.push("SIMULATED_ENTRY_NOT_IMPLEMENTED");
  return Object.freeze({
    status: reasons.some((reason) => reason.startsWith("LIFECYCLE_"))
      ? "REJECTED"
      : "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    reasons: Object.freeze(reasons),
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
