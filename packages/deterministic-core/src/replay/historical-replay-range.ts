import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

export interface HistoricalReplayRangeInput {
  readonly startUtc: string;
  readonly endUtc: string;
}

export type HistoricalReplayRange =
  | {
      readonly kind: "RANGE";
      readonly startUtc: string;
      readonly endUtc: string;
      readonly candles: readonly HistoricalReplayCandle[];
    }
  | {
      readonly kind: "EMPTY";
      readonly startUtc: string;
      readonly endUtc: string;
    }
  | {
      readonly kind: "UNAVAILABLE";
      readonly reason: "REPLAY_REJECTED";
    };

const UTC_MILLISECOND_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function toUtcMilliseconds(value: string): number {
  if (!UTC_MILLISECOND_TIMESTAMP.test(value)) {
    throw new Error(
      "Historical Replay range timestamps must be canonical UTC milliseconds",
    );
  }

  const milliseconds = new Date(value).getTime();
  if (
    !Number.isFinite(milliseconds) ||
    new Date(milliseconds).toISOString() !== value
  ) {
    throw new Error(
      "Historical Replay range timestamps must be valid canonical UTC milliseconds",
    );
  }

  return milliseconds;
}

function candleUtcMilliseconds(candle: HistoricalReplayCandle): number {
  return new Date(candle.timestampUtc).getTime();
}

/**
 * Selects an immutable inclusive UTC range from an already-admitted local
 * Replay. It has no filesystem, network, storage, Paper, OMS, or execution
 * capability. Rejected Replay evidence cannot disclose candles through this
 * query.
 */
export function readHistoricalReplayRange(
  playback: Readonly<HistoricalReplayPlayback>,
  input: Readonly<HistoricalReplayRangeInput>,
): HistoricalReplayRange {
  const startMilliseconds = toUtcMilliseconds(input.startUtc);
  const endMilliseconds = toUtcMilliseconds(input.endUtc);
  if (endMilliseconds < startMilliseconds) {
    throw new Error("Historical Replay range endUtc must not precede startUtc");
  }

  if (playback.status !== "REPLAY_READY") {
    return Object.freeze({ kind: "UNAVAILABLE", reason: "REPLAY_REJECTED" });
  }

  const candles = playback.candles.filter((candle) => {
    const milliseconds = candleUtcMilliseconds(candle);
    return milliseconds >= startMilliseconds && milliseconds <= endMilliseconds;
  });

  if (candles.length === 0) {
    return Object.freeze({
      kind: "EMPTY",
      startUtc: input.startUtc,
      endUtc: input.endUtc,
    });
  }

  return Object.freeze({
    kind: "RANGE",
    startUtc: input.startUtc,
    endUtc: input.endUtc,
    candles: Object.freeze([...candles]),
  });
}
