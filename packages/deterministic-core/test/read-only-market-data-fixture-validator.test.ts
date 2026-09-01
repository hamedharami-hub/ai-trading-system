import { describe, expect, it } from "vitest";
import { validateReadOnlyMarketDataFixture } from "../src/replay/read-only-market-data-fixture-validator.js";

describe("read-only market-data fixture validator", () => {
  it("accepts canonical local replay evidence only", () => {
    expect(
      validateReadOnlyMarketDataFixture({
        fixtureId: "market-replay-001",
        sourceKind: "REPLAY",
        observations: [
          {
            eventId: "market-a",
            streamId: "btc-l2",
            sequence: "41",
            receivedIndex: 1,
            timestampExchange: "2026-09-01T00:00:00.000Z",
            timestampLocal: "2026-09-01T00:00:00.020Z",
          },
          {
            eventId: "market-b",
            streamId: "btc-l2",
            sequence: "42",
            receivedIndex: 2,
            timestampExchange: "2026-09-01T00:00:00.050Z",
            timestampLocal: "2026-09-01T00:00:00.070Z",
          },
        ],
      }),
    ).toEqual({
      fixtureId: "market-replay-001",
      status: "REPLAY_ONLY_VALID",
      observationCount: 2,
      rejectedCount: 0,
      rejectionReasons: [],
      freshnessEvaluated: false,
      requiresFreshnessPolicy: true,
      executionEligible: false,
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed on a missing timestamp without assessing freshness", () => {
    const report = validateReadOnlyMarketDataFixture({
      fixtureId: "market-replay-invalid-time",
      sourceKind: "MOCK",
      observations: [
        {
          eventId: "market-a",
          streamId: "fx-tick",
          receivedIndex: 1,
          timestampExchange: "2026-09-01T00:00:00.000Z",
        },
      ],
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toEqual(["INVALID_TIMESTAMP_LOCAL"]);
    expect(report.freshnessEvaluated).toBe(false);
    expect(report.executionEligible).toBe(false);
  });

  it("rejects a timestamp that matches the shape but is not a real UTC date", () => {
    const report = validateReadOnlyMarketDataFixture({
      fixtureId: "market-replay-invalid-date",
      sourceKind: "MOCK",
      observations: [
        {
          eventId: "market-a",
          streamId: "fx-tick",
          receivedIndex: 1,
          timestampExchange: "2026-13-01T00:00:00.000Z",
          timestampLocal: "2026-09-01T00:00:00.000Z",
        },
      ],
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toEqual(["INVALID_TIMESTAMP_EXCHANGE"]);
  });

  it("rejects missing event and stream identity", () => {
    const report = validateReadOnlyMarketDataFixture({
      fixtureId: "market-replay-missing-identity",
      sourceKind: "MOCK",
      observations: [
        {
          eventId: "",
          streamId: "",
          receivedIndex: 1,
          timestampExchange: "2026-09-01T00:00:00.000Z",
          timestampLocal: "2026-09-01T00:00:00.000Z",
        },
      ],
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toEqual([
      "MISSING_EVENT_ID",
      "MISSING_STREAM_ID",
    ]);
  });

  it("keeps a sequence gap ineligible for every downstream action", () => {
    const report = validateReadOnlyMarketDataFixture({
      fixtureId: "market-replay-gap",
      sourceKind: "REPLAY",
      observations: [
        {
          eventId: "market-a",
          streamId: "btc-l2",
          sequence: "1",
          receivedIndex: 1,
          timestampExchange: "2026-09-01T00:00:00.000Z",
          timestampLocal: "2026-09-01T00:00:00.020Z",
        },
        {
          eventId: "market-b",
          streamId: "btc-l2",
          sequence: "3",
          receivedIndex: 2,
          timestampExchange: "2026-09-01T00:00:00.050Z",
          timestampLocal: "2026-09-01T00:00:00.070Z",
        },
      ],
    });

    expect(report.rejectionReasons).toEqual(["SEQUENCE_GAP"]);
    expect(report.executionEligible).toBe(false);
    expect(report.orderIntentsCreated).toBe(0);
    expect(report.executionReportsCreated).toBe(0);
    expect(report.simulatedFillsCreated).toBe(0);
    expect(report.externalRequestsMade).toBe(0);
  });
});
