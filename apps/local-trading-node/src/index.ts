import {
  REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS,
  summarizeLocalPaperReadiness,
  type LocalPaperReadinessSummary,
} from "@trade/deterministic-core";

export interface LocalNodeOfflineDiagnostic {
  readonly kind: "OFFLINE_LOCAL_NODE_DIAGNOSTIC";
  readonly transportStarted: false;
  readonly schedulerStarted: false;
  readonly environmentRead: false;
  readonly datasetsRead: 0;
  readonly persistenceMutations: 0;
  readonly externalRequestsMade: 0;
  readonly readiness: LocalPaperReadinessSummary;
}

/**
 * Produces a deterministic, local-only safety report. It deliberately has no
 * filesystem, environment, clock, transport, scheduler, or persistence input.
 */
export function createLocalNodeOfflineDiagnostic(): LocalNodeOfflineDiagnostic {
  const readiness = summarizeLocalPaperReadiness({
    entryDecisionIds: REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS,
    policyRisk: {
      policyContractId: "policy-contract-v1",
      policyEvidenceId: "policy-evidence-v1",
      riskContractId: "risk-contract-v1",
      riskEvidenceId: "risk-evidence-v1",
    },
    preEntry: {
      recordId: "local-node-offline-diagnostic-v1",
      knownRecordIds: [],
      replayEvidenceId: "replay-evidence-v1",
      fixtureEvidenceId: "fixture-evidence-v1",
      auditEvidenceId: "audit-evidence-v1",
      protectiveEvidenceId: "protective-evidence-v1",
      terminalState: "NO_TRADE",
    },
  });

  return Object.freeze({
    kind: "OFFLINE_LOCAL_NODE_DIAGNOSTIC",
    transportStarted: false,
    schedulerStarted: false,
    environmentRead: false,
    datasetsRead: 0,
    persistenceMutations: 0,
    externalRequestsMade: 0,
    readiness,
  });
}
