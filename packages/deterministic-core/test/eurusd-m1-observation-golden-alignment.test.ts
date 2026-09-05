import { describe, expect, it } from "vitest";
import { collectEurUsdM1ReplayObservationBatch } from "../src/replay/eurusd-m1-replay-observation-batch.js";
import { evaluateEurUsdM1GoldenEvidenceReadiness } from "../src/replay/eurusd-m1-golden-evidence-readiness.js";
import { validateEurUsdM1GoldenLabelSet } from "../src/replay/eurusd-m1-golden-label-set-validator.js";
import { digestEurUsdM1GoldenLabelSet } from "../src/replay/eurusd-m1-golden-label-set-digest.js";
import { evaluateEurUsdM1ObservationGoldenAlignment } from "../src/replay/eurusd-m1-observation-golden-alignment.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function buildPlayback(): HistoricalReplayPlayback {
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

const labelSet = {
  ownerLabelSetId: "owner-labels-v1",
  labels: [
    { cursor: 14, labelId: "label-a" },
    { cursor: 19, labelId: "label-b" },
  ],
};

describe("EURUSD M1 observation and golden label alignment (Phase 5BU)", () => {
  it("aligns observation batch and golden label set when cursors match exactly", async () => {
    const playback = buildPlayback();
    const batch = await collectEurUsdM1ReplayObservationBatch({
      playback,
      instrument: "EURUSD",
      timeframe: "M1",
      cursors: [14, 19],
    });

    const labels = validateEurUsdM1GoldenLabelSet({
      playback,
      manifest,
      labelSet,
    });
    const digest = await digestEurUsdM1GoldenLabelSet(labels);
    if (digest.kind !== "GOLDEN_LABEL_SET_DIGEST")
      throw new Error("digest fixture failure");

    const goldenReadiness = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback,
      manifest,
      labelSet,
      expectedLabelSetDigest: digest.sha256,
    });

    const report = evaluateEurUsdM1ObservationGoldenAlignment({
      observationBatch: batch,
      goldenReadiness,
      labelSet,
    });

    expect(report.kind).toBe("ALIGNMENT_MATCH");
    expect(report.status).toBe("ALIGNMENT_ALIGNED");
    expect(report.reasons).toEqual([]);
    expect(report.alignedEntries).toHaveLength(2);
    expect(report.alignedEntries[0]?.cursor).toBe(14);
    expect(report.alignedEntries[0]?.labelId).toBe("label-a");
    expect(report.alignedEntries[1]?.cursor).toBe(19);
    expect(report.alignedEntries[1]?.labelId).toBe("label-b");
    expect(report.executionEligible).toBe(false);
    expect(report.strategyCandidatesCreated).toBe(0);
    expect(report.orderIntentsCreated).toBe(0);
    expect(report.externalRequestsMade).toBe(0);
  });

  it("reports cursor mismatch when cursors or count differ", async () => {
    const playback = buildPlayback();
    const batch = await collectEurUsdM1ReplayObservationBatch({
      playback,
      instrument: "EURUSD",
      timeframe: "M1",
      cursors: [14, 20], // cursor 20 instead of 19
    });

    const labels = validateEurUsdM1GoldenLabelSet({
      playback,
      manifest,
      labelSet,
    });
    const digest = await digestEurUsdM1GoldenLabelSet(labels);
    if (digest.kind !== "GOLDEN_LABEL_SET_DIGEST")
      throw new Error("digest fixture failure");

    const goldenReadiness = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback,
      manifest,
      labelSet,
      expectedLabelSetDigest: digest.sha256,
    });

    const report = evaluateEurUsdM1ObservationGoldenAlignment({
      observationBatch: batch,
      goldenReadiness,
      labelSet,
    });

    expect(report.kind).toBe("ALIGNMENT_MISMATCH");
    expect(report.status).toBe("ALIGNMENT_CURSOR_MISMATCH");
    expect(report.reasons[0]).toContain("CURSOR_SEQUENCE_MISMATCH");
    expect(report.alignedEntries).toEqual([]);
    expect(report.executionEligible).toBe(false);
  });

  it("fails closed and reports input rejected when observation batch is unavailable", async () => {
    const playback = buildPlayback();
    const batch = await collectEurUsdM1ReplayObservationBatch({
      playback,
      instrument: "EURUSD",
      timeframe: "M1",
      cursors: [19, 14], // unordered sequence -> unavailable
    });

    const labels = validateEurUsdM1GoldenLabelSet({
      playback,
      manifest,
      labelSet,
    });
    const digest = await digestEurUsdM1GoldenLabelSet(labels);
    if (digest.kind !== "GOLDEN_LABEL_SET_DIGEST")
      throw new Error("digest fixture failure");

    const goldenReadiness = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback,
      manifest,
      labelSet,
      expectedLabelSetDigest: digest.sha256,
    });

    const report = evaluateEurUsdM1ObservationGoldenAlignment({
      observationBatch: batch,
      goldenReadiness,
      labelSet,
    });

    expect(report.kind).toBe("ALIGNMENT_REJECTED");
    expect(report.status).toBe("ALIGNMENT_INPUT_REJECTED");
    expect(report.reasons[0]).toContain("OBSERVATION_BATCH_UNAVAILABLE");
    expect(report.alignedEntries).toEqual([]);
    expect(report.executionEligible).toBe(false);
  });

  it("fails closed when golden readiness is rejected", async () => {
    const playback = buildPlayback();
    const batch = await collectEurUsdM1ReplayObservationBatch({
      playback,
      instrument: "EURUSD",
      timeframe: "M1",
      cursors: [14, 19],
    });

    const goldenReadiness = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback,
      manifest,
      labelSet,
      expectedLabelSetDigest: "f".repeat(64), // invalid expected digest
    });

    const report = evaluateEurUsdM1ObservationGoldenAlignment({
      observationBatch: batch,
      goldenReadiness,
      labelSet,
    });

    expect(report.kind).toBe("ALIGNMENT_REJECTED");
    expect(report.status).toBe("ALIGNMENT_INPUT_REJECTED");
    expect(report.reasons).toContain("GOLDEN_EVIDENCE_NOT_READY");
    expect(report.alignedEntries).toEqual([]);
    expect(report.executionEligible).toBe(false);
  });
});
