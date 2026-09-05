import { validatePayload } from "@trade/contracts";
import { describe, expect, it } from "vitest";
import {
  createDeterministicUuidV7,
  evaluateEurUsdM1StrategyCandidate,
  type EurUsdM1StrategyCandidateInput,
} from "../src/replay/eurusd-m1-strategy-candidate-evaluator.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function candle(
  input: Partial<HistoricalReplayCandle> = {},
): HistoricalReplayCandle {
  return {
    timestampUtc: "2025-08-01T00:00:00.000Z",
    open: "1.00000",
    high: "1.00040",
    low: "1.00000",
    close: "1.00000",
    volume: "1",
    ...input,
  };
}

function playback(
  candles: readonly HistoricalReplayCandle[],
  status: "REPLAY_READY" | "REJECTED" = "REPLAY_READY",
): HistoricalReplayPlayback {
  return Object.freeze({
    datasetId: "eurusd-m1-local-replay",
    status,
    candles: Object.freeze([...candles]),
    rejectionReasons: Object.freeze(
      status === "REJECTED" ? ["REPLAY_GAP_DETECTED"] : [],
    ),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}

describe("EURUSD M1 StrategyCandidate Evaluator", () => {
  describe("UUIDv7 generator", () => {
    it("produces deterministic canonical UUIDv7 matching format", () => {
      const uuid1 = createDeterministicUuidV7(1725148800000, 19);
      const uuid2 = createDeterministicUuidV7(1725148800000, 19);
      expect(uuid1).toBe(uuid2);
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });

  describe("Fail-closed scope and input boundaries", () => {
    it("fails closed on unsupported scope", () => {
      const report = evaluateEurUsdM1StrategyCandidate({
        playback: playback([candle()]),
        instrument: "GBPUSD",
        timeframe: "1M",
        cursor: 0,
      });

      expect(report).toMatchObject({
        kind: "CANDIDATE_REJECTED",
        status: "UNSUPPORTED_SCOPE",
        candidate: null,
        executionEligible: false,
        strategyCandidatesCreated: 0,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
      expect(report.reasons[0]).toContain("UNSUPPORTED_SCOPE");
    });

    it("fails closed on rejected replay playback", () => {
      const report = evaluateEurUsdM1StrategyCandidate({
        playback: playback([candle()], "REJECTED"),
        instrument: "EURUSD",
        timeframe: "1M",
        cursor: 0,
      });

      expect(report).toMatchObject({
        kind: "CANDIDATE_REJECTED",
        status: "REPLAY_REJECTED",
        candidate: null,
        strategyCandidatesCreated: 0,
      });
    });

    it("fails closed on invalid cursor", () => {
      const report = evaluateEurUsdM1StrategyCandidate({
        playback: playback([candle()]),
        instrument: "EURUSD",
        timeframe: "1M",
        cursor: 5,
      });

      expect(report).toMatchObject({
        kind: "CANDIDATE_REJECTED",
        status: "INVALID_CURSOR",
        candidate: null,
        strategyCandidatesCreated: 0,
      });
    });

    it("fails closed when observation context is insufficient", () => {
      const report = evaluateEurUsdM1StrategyCandidate({
        playback: playback([candle()]),
        instrument: "EURUSD",
        timeframe: "M1",
        cursor: 0,
      });

      expect(report).toMatchObject({
        kind: "CANDIDATE_REJECTED",
        status: "INSUFFICIENT_OBSERVATION_CONTEXT",
        candidate: null,
        strategyCandidatesCreated: 0,
      });
    });

    it("fails closed with NO_STRUCTURE_BREAK when no BOS is observed", () => {
      // 25 identical candles: confirmed swings exist but no break occurs
      const candles = Array.from({ length: 25 }, () =>
        candle({
          open: "1.00010",
          high: "1.00020",
          low: "1.00000",
          close: "1.00010",
        }),
      );

      const report = evaluateEurUsdM1StrategyCandidate({
        playback: playback(candles),
        instrument: "EURUSD",
        timeframe: "M1",
        cursor: 19,
      });

      expect(report).toMatchObject({
        kind: "CANDIDATE_REJECTED",
        status: "NO_STRUCTURE_BREAK",
        candidate: null,
        strategyCandidatesCreated: 0,
      });
    });
  });

  describe("Qualified candidate evaluation", () => {
    it("evaluates a qualified Bullish StrategyCandidate with valid schema, A grade, and 2.0 R:R", () => {
      const candles = Array.from({ length: 25 }, (_, i) =>
        candle({
          timestampUtc: `2025-08-01T00:${i.toString().padStart(2, "0")}:00.000Z`,
          open: "1.00000",
          high: "1.00030",
          low: "1.00000",
          close: "1.00020",
        }),
      );

      // Swing High at cursor 5
      candles[5] = candle({
        timestampUtc: "2025-08-01T00:05:00.000Z",
        open: "1.00000",
        high: "1.00100",
        low: "1.00000",
        close: "1.00050",
      });

      // Swing Low around cursor 12
      candles[12] = candle({
        timestampUtc: "2025-08-01T00:12:00.000Z",
        open: "1.00000",
        high: "1.00030",
        low: "0.99950",
        close: "0.99970",
      });

      // Candle 17 (k-2): high at 1.00040
      candles[17] = candle({
        timestampUtc: "2025-08-01T00:17:00.000Z",
        open: "1.00020",
        high: "1.00040",
        low: "1.00010",
        close: "1.00030",
      });

      // Candle 18 (k-1): impulsive upward move
      candles[18] = candle({
        timestampUtc: "2025-08-01T00:18:00.000Z",
        open: "1.00030",
        high: "1.00090",
        low: "1.00030",
        close: "1.00085",
      });

      // Candle 19 (k): Bullish Displacement breaking Swing High 1.00100, leaving FVG gap above 1.00040
      candles[19] = candle({
        timestampUtc: "2025-08-01T00:19:00.000Z",
        open: "1.00080",
        high: "1.00140",
        low: "1.00060",
        close: "1.00130",
      });

      const report = evaluateEurUsdM1StrategyCandidate({
        playback: playback(candles),
        instrument: "EURUSD",
        timeframe: "M1",
        cursor: 19,
      });

      expect(report.kind).toBe("CANDIDATE_EVALUATED");
      expect(report.status).toBe("CANDIDATE_QUALIFIED");
      expect(report.executionEligible).toBe(false);
      expect(report.strategyCandidatesCreated).toBe(1);
      expect(report.orderIntentsCreated).toBe(0);
      expect(report.externalRequestsMade).toBe(0);

      const candidate = report.candidate!;
      expect(candidate).toBeDefined();
      expect(candidate.symbol).toBe("EURUSD");
      expect(candidate.side).toBe("BUY");
      expect(candidate.engine_type).toBe("SCALP");
      expect(candidate.expiry_candles).toBe(3);
      expect(candidate.risk_reward_ratio).toBe("2.000");

      // Verify schema compliance via @trade/contracts Ajv validator
      const validation = validatePayload("STRATEGY_CANDIDATE", candidate);
      expect(validation.valid).toBe(true);

      // Verify price geometry: Target > Entry > Invalidation
      const entry = parseFloat(candidate.entry_price);
      const invalidation = parseFloat(candidate.invalidation_price);
      const target = parseFloat(candidate.target_price);

      expect(entry).toBeGreaterThan(invalidation);
      expect(target).toBeGreaterThan(entry);
    });
  });
});
