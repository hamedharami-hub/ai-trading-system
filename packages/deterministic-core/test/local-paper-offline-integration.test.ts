import { describe, expect, it } from "vitest";
import { evaluateLocalPaperOfflineIntegration } from "../src/paper/local-paper-offline-integration.js";
import { createLocalPaperSimulatedRecord } from "../src/paper/local-paper-simulated-record.js";
import {
  appendLocalPaperSimulatedAuditRecord,
  createLocalPaperSimulatedAuditRecord,
  reconstructLocalPaperSimulatedAudit,
} from "../src/paper/local-paper-simulated-audit.js";
import { LOCAL_PAPER_SIMULATION_FIXTURES } from "../src/paper/local-paper-simulation-fixtures.js";

describe("local Paper offline integration", () => {
  it("has a deterministic six-scenario zero-artifact fixture matrix", () => {
    expect(
      LOCAL_PAPER_SIMULATION_FIXTURES.map((fixture) => fixture.scenario),
    ).toEqual([
      "ACCEPTED",
      "REJECTED",
      "EXPIRED",
      "DUPLICATE",
      "CANCELLED",
      "UNKNOWN",
    ]);
    expect(
      LOCAL_PAPER_SIMULATION_FIXTURES.every(
        (fixture) =>
          fixture.orderIntentsCreated === 0 &&
          fixture.simulatedFillsCreated === 0 &&
          fixture.positionsCreated === 0 &&
          !fixture.profitLossCalculated &&
          !fixture.executionEligible,
      ),
    ).toBe(true);
  });

  it("keeps every integration path no-trade or rejected", () => {
    expect(
      evaluateLocalPaperOfflineIntegration({
        fixtureId: "paper-accepted-v1",
        recordId: "run-1",
        knownRecordIds: [],
        replayAccepted: true,
        assumptionsComplete: true,
      }),
    ).toMatchObject({
      status: "NO_TRADE",
      reasons: [
        "SIMULATED_ENTRY_NOT_IMPLEMENTED",
        "SIMULATED_ENTRY_NOT_IMPLEMENTED",
      ],
    });
    expect(
      evaluateLocalPaperOfflineIntegration({
        fixtureId: "paper-expired-v1",
        recordId: "run-2",
        knownRecordIds: [],
        replayAccepted: true,
        assumptionsComplete: true,
      }).reasons,
    ).toContain("CANDIDATE_EXPIRED");
    expect(
      evaluateLocalPaperOfflineIntegration({
        fixtureId: "unknown",
        recordId: "run-3",
        knownRecordIds: [],
        replayAccepted: true,
        assumptionsComplete: true,
      }),
    ).toMatchObject({ status: "REJECTED", reasons: ["FIXTURE_UNKNOWN"] });
  });

  it("appends and reconstructs local-only audit evidence without mutation", () => {
    const record = createLocalPaperSimulatedRecord({
      recordId: "run-1",
      replayDatasetId: "historical-replay-evidence-v1",
      fixtureId: "paper-accepted-v1",
      terminalState: "NO_TRADE",
      reasons: ["SIMULATED_ENTRY_NOT_IMPLEMENTED"],
    });
    const audit = createLocalPaperSimulatedAuditRecord("audit-1", record);
    const log = appendLocalPaperSimulatedAuditRecord([], audit);
    expect(reconstructLocalPaperSimulatedAudit(log)).toBe("RECONSTRUCTED");
    expect(() => appendLocalPaperSimulatedAuditRecord(log, audit)).toThrow(
      "Duplicate Local Paper simulated audit ID",
    );
  });
});
