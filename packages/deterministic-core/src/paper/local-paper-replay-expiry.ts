export interface LocalPaperReplayExpiryResult {
  readonly status: "NO_TRADE";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly expired: boolean;
  readonly reasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

const EXPIRY_AFTER_COMPLETE_CANDLES = 3;

/**
 * Applies only the owner-approved EUR/USD M1 local Replay expiry boundary.
 * It never creates a Paper entry, even before expiry.
 */
export function evaluateLocalPaperReplayExpiry(
  candidateCandleIndex: number | undefined,
  observedCandleIndex: number | undefined,
  replayEvidenceComplete: boolean,
): LocalPaperReplayExpiryResult {
  const invalidIndex =
    candidateCandleIndex === undefined ||
    observedCandleIndex === undefined ||
    !Number.isInteger(candidateCandleIndex) ||
    !Number.isInteger(observedCandleIndex) ||
    candidateCandleIndex < 0 ||
    observedCandleIndex < candidateCandleIndex;
  const expired =
    !invalidIndex &&
    replayEvidenceComplete &&
    observedCandleIndex - candidateCandleIndex >= EXPIRY_AFTER_COMPLETE_CANDLES;
  const reasons = invalidIndex
    ? ["REPLAY_CANDLE_INDEX_INVALID"]
    : !replayEvidenceComplete
      ? ["REPLAY_EVIDENCE_INCOMPLETE"]
      : expired
        ? ["CANDIDATE_EXPIRED_AFTER_THREE_COMPLETE_M1_CANDLES"]
        : ["SIMULATED_ENTRY_NOT_IMPLEMENTED"];
  return Object.freeze({
    status: "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    expired,
    reasons: Object.freeze(reasons),
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
