export interface ClockSyncConfig {
  maxDriftMs: number; // Max allowed clock offset before marking degraded (default 500ms)
  staleThresholdMs: number; // Max duration without data before marking stale (default 5000ms)
  alpha: number; // Smoothing factor for exponential moving average
}

export const DEFAULT_CLOCK_CONFIG: ClockSyncConfig = {
  maxDriftMs: 500,
  staleThresholdMs: 5000,
  alpha: 0.1
};

export class ClockSyncTracker {
  private smoothedOffsetMs = 0;
  private sampleCount = 0;
  private lastExchangeTimeMs = 0;
  private lastLocalTimeMs = 0;

  constructor(private readonly config: ClockSyncConfig = DEFAULT_CLOCK_CONFIG) {}

  /**
   * Records a timestamp pair from an incoming market data event.
   * @param exchangeTimestampISO RFC 3339 timestamp from exchange
   * @param localTimestampMs Local machine arrival timestamp in epoch ms
   */
  public recordSample(exchangeTimestampISO: string, localTimestampMs: number = Date.now()): number {
    const exchangeMs = new Date(exchangeTimestampISO).getTime();
    if (Number.isNaN(exchangeMs)) {
      throw new Error(`Invalid exchange timestamp: "${exchangeTimestampISO}"`);
    }

    const rawOffset = localTimestampMs - exchangeMs;
    this.lastExchangeTimeMs = exchangeMs;
    this.lastLocalTimeMs = localTimestampMs;

    if (this.sampleCount === 0) {
      this.smoothedOffsetMs = rawOffset;
    } else {
      this.smoothedOffsetMs = this.config.alpha * rawOffset + (1 - this.config.alpha) * this.smoothedOffsetMs;
    }
    this.sampleCount++;

    return rawOffset;
  }

  public getSmoothedOffsetMs(): number {
    return Math.round(this.smoothedOffsetMs);
  }

  public isDriftExceeded(): boolean {
    return Math.abs(this.smoothedOffsetMs) > this.config.maxDriftMs;
  }

  public isStale(currentLocalTimeMs: number = Date.now()): boolean {
    if (this.lastLocalTimeMs === 0) return true;
    return (currentLocalTimeMs - this.lastLocalTimeMs) > this.config.staleThresholdMs;
  }

  public getLastExchangeTime(): number {
    return this.lastExchangeTimeMs;
  }

  public reset(): void {
    this.smoothedOffsetMs = 0;
    this.sampleCount = 0;
    this.lastExchangeTimeMs = 0;
    this.lastLocalTimeMs = 0;
  }
}
