import { describe, expect, it } from "vitest";
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

function manifest() {
  return {
    manifestVersion: "eurusd-m1-golden-manifest-v1" as const,
    datasetId: "eurusd-m1-local-replay",
    replaySha256: "a".repeat(64),
    instrument: "EURUSD" as const,
    timeframe: "M1" as const,
    sourceKind: "REPLAY" as const,
    ownerLabelSetId: "owner-labels-v1",
    labeledCursors: [14, 19],
  };
}

describe("EURUSD M1 Golden label set", () => {
  it("accepts exactly one opaque owner label for every manifest cursor", () => {
    expect(
      validateEurUsdM1GoldenLabelSet({
        playback: playback(),
        manifest: manifest(),
        labelSet: {
          ownerLabelSetId: "owner-labels-v1",
          labels: [
            { cursor: 14, labelId: "label-a" },
            { cursor: 19, labelId: "label-b" },
          ],
        },
      }),
    ).toMatchObject({
      kind: "GOLDEN_LABEL_SET_ACCEPTED",
      validatedLabelCount: 2,
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed when identity, cursor binding, or label uniqueness is invalid", () => {
    expect(
      validateEurUsdM1GoldenLabelSet({
        playback: playback(),
        manifest: manifest(),
        labelSet: {
          ownerLabelSetId: "other-owner",
          labels: [
            { cursor: 19, labelId: "duplicate" },
            { cursor: 14, labelId: "duplicate" },
          ],
        },
      }),
    ).toMatchObject({
      kind: "GOLDEN_LABEL_SET_REJECTED",
      validatedLabelCount: 0,
      rejectionReasons: expect.arrayContaining([
        "OWNER_LABEL_SET_ID_MISMATCH",
        "INVALID_OR_DUPLICATE_LABEL_ID",
        "CURSOR_BINDING_MISMATCH",
      ]),
    });
  });
});
