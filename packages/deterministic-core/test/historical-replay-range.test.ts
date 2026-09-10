import { describe, expect, it } from "vitest";
import {
  prepareHistoricalReplay,
  readHistoricalReplayRange,
} from "../src/index.js";

const SHA256 = "a".repeat(64);
const VALID_CSV = [
  "Etc/UTC,Open,High,Low,Close,Volume",
  "2025-08-01T00:00:00+00:00,1.14217,1.14217,1.14192,1.14194,101130000",
  "2025-08-01T00:01:00+00:00,1.14193,1.14193,1.14153,1.14161,78360000",
  "2025-08-01T00:02:00+00:00,1.14161,1.14180,1.14157,1.14173,80100000",
].join("\n");

function admittedPlayback() {
  return prepareHistoricalReplay({
    datasetId: "eurusd-m1-range",
    expectedSha256: SHA256,
    actualSha256: SHA256,
    csvText: VALID_CSV,
  });
}

describe("historical Replay range query", () => {
  it("returns an immutable inclusive range in recorded order", () => {
    const range = readHistoricalReplayRange(admittedPlayback(), {
      startUtc: "2025-08-01T00:01:00.000Z",
      endUtc: "2025-08-01T00:02:00.000Z",
    });

    expect(range).toMatchObject({
      kind: "RANGE",
      candles: [
        { timestampUtc: "2025-08-01T00:01:00+00:00" },
        { timestampUtc: "2025-08-01T00:02:00+00:00" },
      ],
    });
    expect(range.kind === "RANGE" && Object.isFrozen(range.candles)).toBe(true);
  });

  it("returns EMPTY for an admitted range with no candles", () => {
    expect(
      readHistoricalReplayRange(admittedPlayback(), {
        startUtc: "2025-08-02T00:00:00.000Z",
        endUtc: "2025-08-02T00:01:00.000Z",
      }),
    ).toEqual({
      kind: "EMPTY",
      startUtc: "2025-08-02T00:00:00.000Z",
      endUtc: "2025-08-02T00:01:00.000Z",
    });
  });

  it("does not disclose rejected Replay candles", () => {
    const rejected = prepareHistoricalReplay({
      datasetId: "rejected-range",
      expectedSha256: SHA256,
      actualSha256: "b".repeat(64),
      csvText: VALID_CSV,
    });

    expect(
      readHistoricalReplayRange(rejected, {
        startUtc: "2025-08-01T00:00:00.000Z",
        endUtc: "2025-08-01T00:02:00.000Z",
      }),
    ).toEqual({ kind: "UNAVAILABLE", reason: "REPLAY_REJECTED" });
  });

  it("rejects ambiguous or inverted range bounds", () => {
    expect(() =>
      readHistoricalReplayRange(admittedPlayback(), {
        startUtc: "2025-08-01T00:00:00Z",
        endUtc: "2025-08-01T00:01:00.000Z",
      }),
    ).toThrow("canonical UTC milliseconds");
    expect(() =>
      readHistoricalReplayRange(admittedPlayback(), {
        startUtc: "2025-08-01T00:02:00.000Z",
        endUtc: "2025-08-01T00:01:00.000Z",
      }),
    ).toThrow("must not precede");
  });
});
