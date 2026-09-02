import type { LocalPaperLifecycleState } from "./local-paper-lifecycle.js";

export interface LocalPaperContractReadinessInput {
  readonly schemaVersion: string | undefined;
  readonly lifecycleContractId: string | undefined;
  readonly expiryContractId: string | undefined;
  readonly idempotencyContractId: string | undefined;
  readonly protectiveHandlingContractId: string | undefined;
  readonly reconciliationContractId: string | undefined;
  readonly evidenceContractId: string | undefined;
  readonly lifecycleSequence: readonly string[];
}

export interface LocalPaperContractReadiness {
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

const SEQUENCE: Readonly<
  Record<LocalPaperLifecycleState, readonly LocalPaperLifecycleState[]>
> = {
  DRAFT: ["POLICY_ALLOWED"],
  POLICY_ALLOWED: ["RISK_APPROVED"],
  RISK_APPROVED: ["INTENT_CREATED"],
  INTENT_CREATED: [],
  NO_TRADE: [],
  CANCELLED: [],
  REJECTED: [],
};

function hasValue(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function isKnownState(value: string): value is LocalPaperLifecycleState {
  return Object.hasOwn(SEQUENCE, value);
}

export function evaluateLocalPaperContractReadiness(
  input: Readonly<LocalPaperContractReadinessInput>,
): LocalPaperContractReadiness {
  const required: readonly [string | undefined, string][] = [
    [input.schemaVersion, "SCHEMA_VERSION_MISSING"],
    [input.lifecycleContractId, "LIFECYCLE_CONTRACT_MISSING"],
    [input.expiryContractId, "EXPIRY_CONTRACT_MISSING"],
    [input.idempotencyContractId, "IDEMPOTENCY_CONTRACT_MISSING"],
    [input.protectiveHandlingContractId, "PROTECTIVE_CONTRACT_MISSING"],
    [input.reconciliationContractId, "RECONCILIATION_CONTRACT_MISSING"],
    [input.evidenceContractId, "EVIDENCE_CONTRACT_MISSING"],
  ];
  const reasons = required
    .filter(([value]) => !hasValue(value))
    .map(([, reason]) => reason);
  for (let index = 0; index < input.lifecycleSequence.length; index += 1) {
    const state = input.lifecycleSequence[index];
    const next = input.lifecycleSequence[index + 1];
    if (state === undefined || !isKnownState(state)) {
      reasons.push("LIFECYCLE_STATE_UNKNOWN");
      continue;
    }
    if (
      next !== undefined &&
      (!isKnownState(next) || !SEQUENCE[state].includes(next))
    ) {
      reasons.push("LIFECYCLE_SEQUENCE_INVALID");
    }
  }
  if (input.lifecycleSequence.length === 0)
    reasons.push("LIFECYCLE_SEQUENCE_MISSING");
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
