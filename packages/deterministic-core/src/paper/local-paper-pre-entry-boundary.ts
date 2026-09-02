export interface LocalPaperPreEntryBoundaryInput {
  readonly recordId: string;
  readonly knownRecordIds: readonly string[];
  readonly replayEvidenceId: string | undefined;
  readonly fixtureEvidenceId: string | undefined;
  readonly auditEvidenceId: string | undefined;
  readonly protectiveEvidenceId: string | undefined;
  readonly terminalState: "NO_TRADE" | "CANCELLED" | "REJECTED" | undefined;
}

export interface LocalPaperPreEntryBoundaryResult {
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

function hasId(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

/**
 * Validates only the owner-approved local pre-entry evidence boundary. It is
 * deliberately incapable of producing an entry or any execution artifact.
 */
export function evaluateLocalPaperPreEntryBoundary(
  input: Readonly<LocalPaperPreEntryBoundaryInput>,
): LocalPaperPreEntryBoundaryResult {
  const reasons: string[] = [];
  if (!hasId(input.recordId)) reasons.push("RECORD_ID_MISSING");
  if (input.knownRecordIds.includes(input.recordId))
    reasons.push("RECORD_ID_DUPLICATE");
  if (!hasId(input.replayEvidenceId)) reasons.push("REPLAY_EVIDENCE_MISSING");
  if (!hasId(input.fixtureEvidenceId)) reasons.push("FIXTURE_EVIDENCE_MISSING");
  if (!hasId(input.auditEvidenceId)) reasons.push("AUDIT_EVIDENCE_MISSING");
  if (!hasId(input.protectiveEvidenceId))
    reasons.push("PROTECTIVE_EVIDENCE_MISSING");
  if (input.terminalState === undefined)
    reasons.push("TERMINAL_EVIDENCE_MISSING");
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
