export interface LocalPaperAssumptionEvidenceInput {
  readonly costEvidenceId: string | undefined;
  readonly partialFillEvidenceId: string | undefined;
  readonly protectiveHandlingEvidenceId: string | undefined;
  readonly reconciliationEvidenceId: string | undefined;
}

export interface LocalPaperAssumptionEvidence {
  readonly status: "NO_TRADE";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly recorded: {
    readonly costs: boolean;
    readonly partialFill: boolean;
    readonly protectiveHandling: boolean;
    readonly reconciliation: boolean;
  };
  readonly missingReasons: readonly string[];
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

function hasEvidenceId(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

/**
 * Records only the presence of local assumption evidence. Evidence values and
 * financial calculations are deliberately not accepted by this contract.
 */
export function evaluateLocalPaperAssumptionEvidence(
  input: Readonly<LocalPaperAssumptionEvidenceInput>,
): LocalPaperAssumptionEvidence {
  const costs = hasEvidenceId(input.costEvidenceId);
  const partialFill = hasEvidenceId(input.partialFillEvidenceId);
  const protectiveHandling = hasEvidenceId(input.protectiveHandlingEvidenceId);
  const reconciliation = hasEvidenceId(input.reconciliationEvidenceId);
  const missingReasons: string[] = [];

  if (!costs) {
    missingReasons.push("COST_EVIDENCE_MISSING");
  }
  if (!partialFill) {
    missingReasons.push("PARTIAL_FILL_EVIDENCE_MISSING");
  }
  if (!protectiveHandling) {
    missingReasons.push("PROTECTIVE_HANDLING_EVIDENCE_MISSING");
  }
  if (!reconciliation) {
    missingReasons.push("RECONCILIATION_EVIDENCE_MISSING");
  }
  if (missingReasons.length === 0) {
    missingReasons.push("SIMULATED_LIFECYCLE_NOT_IMPLEMENTED");
  }

  return Object.freeze({
    status: "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    recorded: Object.freeze({
      costs,
      partialFill,
      protectiveHandling,
      reconciliation,
    }),
    missingReasons: Object.freeze(missingReasons),
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
