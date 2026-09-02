import {
  validateHistoricalReplayCsv,
  type HistoricalReplayAdmissionInput,
  type HistoricalReplayAdmissionReport,
} from "./historical-replay-admission-validator.js";

export interface HistoricalReplayCandle {
  readonly timestampUtc: string;
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
  readonly volume: string;
}

export type HistoricalReplayPlaybackStatus = "REPLAY_READY" | "REJECTED";

export interface HistoricalReplayPlayback {
  readonly datasetId: string;
  readonly status: HistoricalReplayPlaybackStatus;
  readonly candles: readonly HistoricalReplayCandle[];
  readonly coverageStartUtc?: string;
  readonly coverageEndUtc?: string;
  readonly rejectionReasons: readonly string[];
  readonly sourceKind: "REPLAY";
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly executionReportsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly externalRequestsMade: 0;
}

export type HistoricalReplayStep =
  | {
      readonly kind: "CANDLE";
      readonly currentCursor: number;
      readonly nextCursor: number;
      readonly candle: HistoricalReplayCandle;
    }
  | {
      readonly kind: "END";
      readonly currentCursor: number;
    };

export type HistoricalReplayPreviewWindow =
  | {
      readonly kind: "WINDOW";
      readonly startCursor: number;
      readonly endCursorExclusive: number;
      readonly candles: readonly HistoricalReplayCandle[];
    }
  | {
      readonly kind: "END";
      readonly currentCursor: number;
    }
  | {
      readonly kind: "UNAVAILABLE";
      readonly reason: "REPLAY_REJECTED";
    };

export type HistoricalReplayStatusSummary =
  | {
      readonly kind: "READY";
      readonly datasetId: string;
      readonly candleCount: number;
      readonly coverageStartUtc?: string;
      readonly coverageEndUtc?: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly orderIntentsCreated: 0;
      readonly executionReportsCreated: 0;
      readonly simulatedFillsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "UNAVAILABLE";
      readonly datasetId: string;
      readonly rejectionReasons: readonly string[];
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly orderIntentsCreated: 0;
      readonly executionReportsCreated: 0;
      readonly simulatedFillsCreated: 0;
      readonly externalRequestsMade: 0;
    };

const MAX_HISTORICAL_REPLAY_PREVIEW_CANDLES = 5;

function toRejectedPlayback(
  admission: HistoricalReplayAdmissionReport,
): HistoricalReplayPlayback {
  return Object.freeze({
    datasetId: admission.datasetId,
    status: "REJECTED",
    candles: Object.freeze([]),
    ...(admission.coverageStartUtc === undefined
      ? {}
      : { coverageStartUtc: admission.coverageStartUtc }),
    ...(admission.coverageEndUtc === undefined
      ? {}
      : { coverageEndUtc: admission.coverageEndUtc }),
    rejectionReasons: Object.freeze([...admission.rejectionReasons]),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}

function materializeCandles(
  csvText: string,
): readonly HistoricalReplayCandle[] {
  const [, ...lines] = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  return Object.freeze(
    lines.map((line) => {
      const [timestampUtc, open, high, low, close, volume] = line.split(",");
      if (
        timestampUtc === undefined ||
        open === undefined ||
        high === undefined ||
        low === undefined ||
        close === undefined ||
        volume === undefined
      ) {
        throw new Error(
          "Admitted historical Replay CSV became structurally invalid",
        );
      }

      return Object.freeze({ timestampUtc, open, high, low, close, volume });
    }),
  );
}

/**
 * Materializes a previously local CSV into immutable, ordered Replay candles.
 * The admission validator executes first; rejected input yields no candles.
 * This function performs no I/O, network work, analysis, Paper, risk, OMS, or
 * execution activity.
 */
export function prepareHistoricalReplay(
  input: Readonly<HistoricalReplayAdmissionInput>,
): HistoricalReplayPlayback {
  const admission = validateHistoricalReplayCsv(input);
  if (admission.status !== "ADMITTED_LOCAL_REPLAY") {
    return toRejectedPlayback(admission);
  }

  return Object.freeze({
    datasetId: admission.datasetId,
    status: "REPLAY_READY",
    candles: materializeCandles(input.csvText),
    ...(admission.coverageStartUtc === undefined
      ? {}
      : { coverageStartUtc: admission.coverageStartUtc }),
    ...(admission.coverageEndUtc === undefined
      ? {}
      : { coverageEndUtc: admission.coverageEndUtc }),
    rejectionReasons: Object.freeze([]),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}

/**
 * Provides deterministic sequential access without an implicit clock or
 * mutable state. The caller owns the cursor and cannot obtain an order intent.
 */
export function advanceHistoricalReplay(
  playback: Readonly<HistoricalReplayPlayback>,
  cursor: number,
): HistoricalReplayStep {
  if (!Number.isSafeInteger(cursor) || cursor < 0) {
    throw new Error("Historical Replay cursor must be a non-negative integer");
  }

  const candle =
    playback.status === "REPLAY_READY" ? playback.candles[cursor] : undefined;
  if (candle === undefined) {
    return Object.freeze({ kind: "END", currentCursor: cursor });
  }

  return Object.freeze({
    kind: "CANDLE",
    currentCursor: cursor,
    nextCursor: cursor + 1,
    candle,
  });
}

/**
 * Reads a small, immutable, recorded-order window for a future local view.
 * It does not wrap, infer candles, perform I/O, or create any trading state.
 */
export function readHistoricalReplayPreviewWindow(
  playback: Readonly<HistoricalReplayPlayback>,
  startCursor: number,
  windowSize: number,
): HistoricalReplayPreviewWindow {
  if (!Number.isSafeInteger(startCursor) || startCursor < 0) {
    throw new Error(
      "Historical Replay preview cursor must be a non-negative integer",
    );
  }

  if (
    !Number.isSafeInteger(windowSize) ||
    windowSize < 1 ||
    windowSize > MAX_HISTORICAL_REPLAY_PREVIEW_CANDLES
  ) {
    throw new Error(
      `Historical Replay preview size must be an integer from 1 to ${MAX_HISTORICAL_REPLAY_PREVIEW_CANDLES}`,
    );
  }

  if (playback.status !== "REPLAY_READY") {
    return Object.freeze({ kind: "UNAVAILABLE", reason: "REPLAY_REJECTED" });
  }

  if (startCursor >= playback.candles.length) {
    return Object.freeze({ kind: "END", currentCursor: startCursor });
  }

  const endCursorExclusive = Math.min(
    startCursor + windowSize,
    playback.candles.length,
  );

  return Object.freeze({
    kind: "WINDOW",
    startCursor,
    endCursorExclusive,
    candles: Object.freeze(
      playback.candles.slice(startCursor, endCursorExclusive),
    ),
  });
}

/**
 * Returns evidence about a prepared Replay without exposing candles or
 * advancing it. This summary is non-authoritative and execution-ineligible.
 */
export function summarizeHistoricalReplay(
  playback: Readonly<HistoricalReplayPlayback>,
): HistoricalReplayStatusSummary {
  if (playback.status !== "REPLAY_READY") {
    return Object.freeze({
      kind: "UNAVAILABLE",
      datasetId: playback.datasetId,
      rejectionReasons: Object.freeze([...playback.rejectionReasons]),
      sourceKind: "REPLAY",
      executionEligible: false,
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  return Object.freeze({
    kind: "READY",
    datasetId: playback.datasetId,
    candleCount: playback.candles.length,
    ...(playback.coverageStartUtc === undefined
      ? {}
      : { coverageStartUtc: playback.coverageStartUtc }),
    ...(playback.coverageEndUtc === undefined
      ? {}
      : { coverageEndUtc: playback.coverageEndUtc }),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}
