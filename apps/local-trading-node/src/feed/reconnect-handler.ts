export interface ReconnectConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitterRatio: number;
  maxAttempts: number;
}

export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  initialDelayMs: 500,
  maxDelayMs: 30000,
  multiplier: 2,
  jitterRatio: 0.2,
  maxAttempts: 10
};

export class ReconnectHandler {
  private attempt = 0;

  constructor(private readonly config: ReconnectConfig = DEFAULT_RECONNECT_CONFIG) {}

  public getAttempt(): number {
    return this.attempt;
  }

  public shouldRetry(): boolean {
    return this.attempt < this.config.maxAttempts;
  }

  public getNextDelayMs(): number {
    this.attempt++;
    const expDelay = this.config.initialDelayMs * Math.pow(this.config.multiplier, this.attempt - 1);
    const cappedDelay = Math.min(expDelay, this.config.maxDelayMs);

    // Add +/- jitterRatio
    const jitter = (Math.random() * 2 - 1) * this.config.jitterRatio * cappedDelay;
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  public reset(): void {
    this.attempt = 0;
  }
}
