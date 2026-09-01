import type { ReadOnlyProviderProfile } from "./read-only-provider-recovery-fixture.js";

export interface ReadOnlyProfileReadinessEvidence {
  readonly termsAndEntitlementEvidence: boolean;
  readonly instrumentMappingRevision: string | null;
  readonly timestampSemanticsEvidence: boolean;
  readonly snapshotRebuildEvidence: boolean;
  readonly recoveryFailureCorpus: boolean;
  readonly credentialCustodyRevision: string | null;
  readonly adapterReviewEvidence: boolean;
}

export interface ConnectivityReadinessManifest {
  readonly schemaVersion: "1.0.0";
  readonly profiles: Readonly<
    Record<ReadOnlyProviderProfile, ReadOnlyProfileReadinessEvidence>
  >;
}

export interface ConnectivityReadinessReport {
  readonly status: "NOT_READY";
  readonly activationAllowed: false;
  readonly executionAllowed: false;
  readonly missingEvidence: readonly string[];
}

const requiredFields: readonly (keyof ReadOnlyProfileReadinessEvidence)[] = [
  "termsAndEntitlementEvidence",
  "instrumentMappingRevision",
  "timestampSemanticsEvidence",
  "snapshotRebuildEvidence",
  "recoveryFailureCorpus",
  "credentialCustodyRevision",
  "adapterReviewEvidence",
];

/**
 * Phase 5C-II intentionally cannot return READY or enable activation. A future
 * separately approved gate must evaluate verified external evidence.
 */
export function evaluateConnectivityReadiness(
  manifest: Readonly<ConnectivityReadinessManifest>,
): ConnectivityReadinessReport {
  const missingEvidence: string[] = [];
  for (const [profile, evidence] of Object.entries(manifest.profiles) as [
    ReadOnlyProviderProfile,
    ReadOnlyProfileReadinessEvidence,
  ][]) {
    for (const field of requiredFields) {
      const value = evidence[field];
      if (value === false || value === null || value === "") {
        missingEvidence.push(`${profile}:${field}`);
      }
    }
  }
  return Object.freeze({
    status: "NOT_READY",
    activationAllowed: false,
    executionAllowed: false,
    missingEvidence: Object.freeze(missingEvidence),
  });
}
