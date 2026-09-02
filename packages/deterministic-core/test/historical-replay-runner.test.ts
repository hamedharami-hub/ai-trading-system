import { describe, expect, it } from "vitest";
import {
  advanceHistoricalReplay,
  prepareHistoricalReplay,
} from "../src/replay/historical-replay-runner.js";

const SHA256 = "a".repeat(64);
const VALID_CSV = [
  "Etc/UTC,Open,High,Low,Close,Volume",
  "2025-08-01T00:00:00+00:00,1.14217,1.14217,1.14192,1.14194,101130000",
  "2025-08-01T00:01:00+00:00,1.14193,1.14193,1.14153,1.14161,78360000",
].join("\n");

describe("historical Replay runner", () => {
  it("materializes admitted candles in recorded order and advances without a clock", () => {
    const playback = prepareHistoricalReplay({
      datasetId: "eurusd-m1-sample",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV,
    });

    expect(playback).toMatchObject({
      status: "REPLAY_READY",
      coverageStartUtc: "2025-08-01T00:00:00+00:00",
      coverageEndUtc: "2025-08-01T00:01:00+00:00",
      sourceKind: "REPLAY",
      executionEligible: false,
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(playback.candles).toEqual([
      {
        timestampUtc: "2025-08-01T00:00:00+00:00",
        open: "1.14217",
        high: "1.14217",
        low: "1.14192",
        close: "1.14194",
        volume: "101130000",
      },
      {
        timestampUtc: "2025-08-01T00:01:00+00:00",
        open: "1.14193",
        high: "1.14193",
        low: "1.14153",
        close: "1.14161",
        volume: "78360000",
      },
    ]);
    expect(advanceHistoricalReplay(playback, 0)).toMatchObject({
      kind: "CANDLE",
      currentCursor: 0,
      nextCursor: 1,
      candle: { timestampUtc: "2025-08-01T00:00:00+00:00" },
    });
    expect(advanceHistoricalReplay(playback, 2)).toEqual({
      kind: "END",
      currentCursor: 2,
    });
  });

  it("fails closed and exposes no candles when admission rejects the CSV", () => {
    const playback = prepareHistoricalReplay({
      datasetId: "changed-file",
      expectedSha256: SHA256,
      actualSha256: "b".repeat(64),
      csvText: VALID_CSV,
    });

    expect(playback.status).toBe("REJECTED");
    expect(playback.candles).toEqual([]);
    expect(playback.rejectionReasons).toContain("SHA256_MISMATCH");
    expect(advanceHistoricalReplay(playback, 0)).toEqual({
      kind: "END",
      currentCursor: 0,
    });
  });

  it("rejects an invalid cursor rather than guessing a replay position", () => {
    const playback = prepareHistoricalReplay({
      datasetId: "eurusd-m1-sample",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV,
    });

    expect(() => advanceHistoricalReplay(playback, -1)).toThrow(
      "Historical Replay cursor must be a non-negative integer",
    );
  });
});
