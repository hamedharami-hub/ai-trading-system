import {
  createLocalPaperTerminalSnapshot,
  type LocalPaperLifecycleState,
  type LocalPaperTerminalSnapshot,
  type LocalPaperTerminalState,
} from "./local-paper-lifecycle.js";

export interface LocalPaperTerminalTransition {
  readonly status: "ACCEPTED" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly from: string;
  readonly target: string;
  readonly reasons: readonly string[];
  readonly terminalSnapshot: LocalPaperTerminalSnapshot | undefined;
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

const NONTERMINAL_STATES: readonly LocalPaperLifecycleState[] = [
  "DRAFT",
  "POLICY_ALLOWED",
  "RISK_APPROVED",
  "INTENT_CREATED",
];

const TERMINAL_STATES: readonly LocalPaperTerminalState[] = [
  "NO_TRADE",
  "CANCELLED",
  "REJECTED",
];

/**
 * Permits terminal evidence only. It neither persists nor advances a Paper
 * lifecycle and cannot create an OrderIntent, entry, fill, position, or P&L.
 */
export function evaluateLocalPaperTerminalTransition(
  from: string,
  target: string,
  reasons: readonly string[],
): LocalPaperTerminalTransition {
  const rejectionReasons: string[] = [];

  if (!NONTERMINAL_STATES.includes(from as LocalPaperLifecycleState)) {
    rejectionReasons.push("SOURCE_STATE_NOT_ELIGIBLE");
  }
  if (!TERMINAL_STATES.includes(target as LocalPaperTerminalState)) {
    rejectionReasons.push("TARGET_STATE_NOT_TERMINAL");
  }
  if (reasons.length === 0 || reasons.some((reason) => reason.trim() === "")) {
    rejectionReasons.push("TERMINAL_REASON_MISSING");
  }

  const accepted = rejectionReasons.length === 0;
  const terminalSnapshot = accepted
    ? createLocalPaperTerminalSnapshot(
        target as LocalPaperTerminalState,
        reasons,
      )
    : undefined;

  return Object.freeze({
    status: accepted ? "ACCEPTED" : "REJECTED",
    label: "PAPER_LOCAL_ONLY",
    from,
    target,
    reasons: Object.freeze(accepted ? [...reasons] : rejectionReasons),
    terminalSnapshot,
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
