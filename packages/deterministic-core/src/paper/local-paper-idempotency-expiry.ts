export interface LocalPaperIdempotencyExpiryInput {
  readonly recordId: string;
  readonly knownRecordIds: readonly string[];
  readonly replayAccepted: boolean;
  readonly candidateExpired: boolean;
  readonly assumptionsComplete: boolean;
}

export interface LocalPaperIdempotencyExpiryResult {
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

export function evaluateLocalPaperIdempotencyAndExpiry(
  input: Readonly<LocalPaperIdempotencyExpiryInput>,
): LocalPaperIdempotencyExpiryResult {
  const reasons: string[] = [];
  if (input.recordId.trim().length === 0) reasons.push("RECORD_ID_MISSING");
  if (input.knownRecordIds.includes(input.recordId))
    reasons.push("RECORD_ID_DUPLICATE");
  if (!input.replayAccepted) reasons.push("REPLAY_UNAVAILABLE");
  if (input.candidateExpired) reasons.push("CANDIDATE_EXPIRED");
  if (!input.assumptionsComplete) reasons.push("ASSUMPTION_EVIDENCE_MISSING");
  if (reasons.length === 0) reasons.push("SIMULATED_ENTRY_NOT_IMPLEMENTED");
  return Object.freeze({
    status: reasons.includes("RECORD_ID_DUPLICATE") ? "REJECTED" : "NO_TRADE",
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
