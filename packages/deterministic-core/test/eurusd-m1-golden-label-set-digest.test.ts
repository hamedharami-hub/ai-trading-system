import { describe, expect, it } from "vitest";
import { digestEurUsdM1GoldenLabelSet } from "../src/replay/eurusd-m1-golden-label-set-digest.js";
import { validateEurUsdM1GoldenLabelSet } from "../src/replay/eurusd-m1-golden-label-set-validator.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function playback(): HistoricalReplayPlayback {
  const candle: HistoricalReplayCandle = {
    timestampUtc: "2025-08-01T00:00:00+00:00",
    open: "1.00000",
    high: "1.00040",
    low: "1.00000",
    close: "1.00000",
    volume: "1",
  };
  return Object.freeze({
    datasetId: "eurusd-m1-local-replay",
    status: "REPLAY_READY",
    candles: Object.freeze(Array.from({ length: 25 }, () => candle)),
    rejectionReasons: Object.freeze([]),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}

const manifest = {
  manifestVersion: "eurusd-m1-golden-manifest-v1" as const,
  datasetId: "eurusd-m1-local-replay",
  replaySha256: "a".repeat(64),
  instrument: "EURUSD" as const,
  timeframe: "M1" as const,
  sourceKind: "REPLAY" as const,
  ownerLabelSetId: "owner-labels-v1",
  labeledCursors: [14, 19],
};

describe("EURUSD M1 Golden label-set digest", () => {
  it("digests accepted local binding deterministically and non-executably", async () => {
    const report = validateEurUsdM1GoldenLabelSet({
      playback: playback(),
      manifest,
      labelSet: {
        ownerLabelSetId: "owner-labels-v1",
        labels: [
          { cursor: 14, labelId: "label-a" },
          { cursor: 19, labelId: "label-b" },
        ],
      },
    });
    const [first, second] = await Promise.all([
      digestEurUsdM1GoldenLabelSet(report),
      digestEurUsdM1GoldenLabelSet(report),
    ]);
    expect(first).toMatchObject({
      kind: "GOLDEN_LABEL_SET_DIGEST",
      labelCount: 2,
      canonicalization: "JCS_RFC8785",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      executionEligible: false,
      orderIntentsCreated: 0,
    });
    if (
      first.kind === "GOLDEN_LABEL_SET_DIGEST" &&
      second.kind === "GOLDEN_LABEL_SET_DIGEST"
    )
      expect(first.sha256).toBe(second.sha256);
  });

  it("does not digest a rejected binding", async () => {
    const report = validateEurUsdM1GoldenLabelSet({
      playback: playback(),
      manifest,
      labelSet: { ownerLabelSetId: "wrong", labels: [] },
    });
    await expect(digestEurUsdM1GoldenLabelSet(report)).resolves.toMatchObject({
      kind: "GOLDEN_LABEL_SET_DIGEST_UNAVAILABLE",
      reason: "LABEL_SET_REJECTED",
      executionEligible: false,
    });
  });
});
