import { describe, expect, it } from "vitest";
import { runOfflineReplay } from "../src/replay/offline-replay-runner.js";

describe("offline replay runner", () => {
  it("reports a healthy fixture without creating an execution artifact", () => {
    expect(
      runOfflineReplay({
        replayId: "replay-valid-001",
        observations: [
          {
            eventId: "a",
            streamId: "fixture",
            sequence: "1",
            receivedIndex: 1,
          },
          {
            eventId: "b",
            streamId: "fixture",
            sequence: "2",
            receivedIndex: 2,
          },
        ],
      }),
    ).toEqual({
      replayId: "replay-valid-001",
      status: "VALID",
      observationCount: 2,
      acceptedCount: 2,
      rejectedCount: 0,
      rejectionReasons: [],
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed on invalid fixture evidence", () => {
    const report = runOfflineReplay({
      replayId: "replay-invalid-001",
      observations: [
        { eventId: "a", streamId: "fixture", sequence: "1", receivedIndex: 1 },
        { eventId: "b", streamId: "fixture", sequence: "3", receivedIndex: 2 },
      ],
    });

    expect(report.status).toBe("INVALID");
    expect(report.rejectionReasons).toEqual(["SEQUENCE_GAP"]);
    expect(report.orderIntentsCreated).toBe(0);
    expect(report.executionReportsCreated).toBe(0);
    expect(report.simulatedFillsCreated).toBe(0);
    expect(report.externalRequestsMade).toBe(0);
  });

  it("rejects an unnamed replay before it can run", () => {
    expect(() =>
      runOfflineReplay({ replayId: "  ", observations: [] }),
    ).toThrow("Offline replay requires a non-empty replayId");
  });
});
