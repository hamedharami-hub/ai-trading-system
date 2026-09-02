export type LocalPaperLifecycleState =
  | "DRAFT"
  | "POLICY_ALLOWED"
  | "RISK_APPROVED"
  | "INTENT_CREATED"
  | "NO_TRADE"
  | "CANCELLED"
  | "REJECTED";

export type LocalPaperTerminalState = Extract<
  LocalPaperLifecycleState,
  "NO_TRADE" | "CANCELLED" | "REJECTED"
>;

export interface LocalPaperTerminalSnapshot {
  readonly label: "PAPER_LOCAL_ONLY";
  readonly state: LocalPaperTerminalState;
  readonly reasons: readonly string[];
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/**
 * Creates immutable terminal evidence only. This contract intentionally cannot
 * construct a Paper record, OrderIntent, simulated entry, fill, position, P&L,
 * or external action.
 */
export function createLocalPaperTerminalSnapshot(
  state: LocalPaperTerminalState,
  reasons: readonly string[],
): LocalPaperTerminalSnapshot {
  if (!isTerminalState(state)) {
    throw new Error("Local Paper lifecycle state must be terminal");
  }
  if (reasons.length === 0 || reasons.some((reason) => reason.trim() === "")) {
    throw new Error("Local Paper terminal evidence requires non-empty reasons");
  }

  return Object.freeze({
    label: "PAPER_LOCAL_ONLY",
    state,
    reasons: Object.freeze([...reasons]),
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}

function isTerminalState(
  state: LocalPaperLifecycleState,
): state is LocalPaperTerminalState {
  return state === "NO_TRADE" || state === "CANCELLED" || state === "REJECTED";
}
