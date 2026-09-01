import { describe, expect, it } from "vitest";
import { evaluateConnectivityReadiness } from "../src/replay/connectivity-readiness-validator.js";

describe("connectivity readiness validator", () => {
  it("fails closed when evidence is absent", () => {
    const missing = {
      termsAndEntitlementEvidence: false,
      instrumentMappingRevision: null,
      timestampSemanticsEvidence: false,
      snapshotRebuildEvidence: false,
      recoveryFailureCorpus: false,
      credentialCustodyRevision: null,
      adapterReviewEvidence: false,
    } as const;
    const report = evaluateConnectivityReadiness({
      schemaVersion: "1.0.0",
      profiles: {
        CTRADER_SPOT_DEPTH_V1: missing,
        BINANCE_SPOT_DEPTH_V1: missing,
        BINANCE_USDM_DEPTH_V1: missing,
      },
    });

    expect(report.status).toBe("NOT_READY");
    expect(report.activationAllowed).toBe(false);
    expect(report.executionAllowed).toBe(false);
    expect(report.missingEvidence).toContain(
      "CTRADER_SPOT_DEPTH_V1:credentialCustodyRevision",
    );
  });
});
