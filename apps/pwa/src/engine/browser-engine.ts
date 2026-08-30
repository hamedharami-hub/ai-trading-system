/**
 * BrowserTradingEngine — runs the full trading engine directly in the browser.
 * No server, no Node.js dependencies. Pure TypeScript computation.
 *
 * This is the cloud-first equivalent of TradingNodeOrchestrator,
 * stripped of the HTTP server (UIBridge) since the UI is in the same process.
 */
import { parseDecimal, toDecimalString, Decimal, computeCanonicalHash } from '@trade/contracts';
import type { MarketId, Timeframe, AuditEventPayload, UUIDv7 } from '@trade/contracts';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type EngineLifecycleState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED';

export interface EngineConfig {
  symbol: MarketId;
  timeframe: Timeframe;
  initialBalance: string;
}

export interface EngineState {
  lifecycleState: EngineLifecycleState;
  equity: string;
  balance: string;
  dailyRealizedLoss: string;
  activePositionsCount: number;
  totalTrades: number;
  uptimeSeconds: number;
  auditEntries: AuditEntry[];
}

export interface AuditEntry {
  action: string;
  actor: string;
  hash: string;
  time: string;
}

export interface CandleInput {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  openTime: string;
  closeTime: string;
}

/* ------------------------------------------------------------------ */
/* UUID Helper                                                         */
/* ------------------------------------------------------------------ */
let _counter = 1;
function makeId(): UUIDv7 {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID() as UUIDv7;
  }
  const hex = (_counter++).toString(16).padStart(12, '0');
  return `018f3a55-0000-7000-8000-${hex}` as UUIDv7;
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */
export class BrowserTradingEngine {
  private state: EngineLifecycleState = 'IDLE';
  private startedAt = 0;
  private equity: Decimal;
  private balance: Decimal;
  private highWaterMark: Decimal;
  private dailyRealizedLoss = new Decimal(0);
  private trades = 0;
  private activePositions = 0;
  private auditEntries: AuditEntry[] = [];
  private lastHash = '0'.repeat(64);
  private listeners: Array<() => void> = [];

  constructor(private readonly config: EngineConfig) {
    const init = parseDecimal(config.initialBalance);
    this.equity = init;
    this.balance = init;
    this.highWaterMark = init;
  }

  /* --- Lifecycle --- */
  public start(): void {
    this.state = 'RUNNING';
    this.startedAt = Date.now();
    this.recordAudit('ENGINE_STARTED', 'SYSTEM');
    this.notify();
  }

  public pause(): void {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      this.recordAudit('ENGINE_PAUSED', 'OPERATOR');
      this.notify();
    }
  }

  public resume(): void {
    if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.recordAudit('ENGINE_RESUMED', 'OPERATOR');
      this.notify();
    }
  }

  public emergencyStop(): void {
    this.state = 'STOPPED';
    this.activePositions = 0;
    this.recordAudit('EMERGENCY_STOP', 'OPERATOR');
    this.notify();
  }

  /* --- Demo Candle Processing --- */
  public processCandle(candle: CandleInput): void {
    if (this.state !== 'RUNNING') return;

    const close = parseDecimal(candle.close);
    const open = parseDecimal(candle.open);
    const diff = close.minus(open);

    // Simple simulation: random-ish trade decisions based on candle data
    const atr = parseDecimal(candle.high).minus(parseDecimal(candle.low));

    if (atr.gt(0) && diff.abs().gt(atr.times('0.3'))) {
      // Simulated trade
      const pnl = diff.times('0.001'); // Tiny simulated PnL
      this.equity = this.equity.plus(pnl);
      this.balance = this.balance.plus(pnl);
      this.trades++;

      if (pnl.lt(0)) {
        this.dailyRealizedLoss = this.dailyRealizedLoss.plus(pnl.abs());
      }

      if (this.equity.gt(this.highWaterMark)) {
        this.highWaterMark = this.equity;
      }

      const side = diff.gt(0) ? 'BUY' : 'SELL';
      this.recordAudit(
        `SIMULATED_TRADE_${side}`,
        'STRATEGY_ENGINE'
      );
    }

    this.notify();
  }

  /* --- Generate Demo Candle (for auto-simulation) --- */
  public generateDemoCandle(basePrice: number): CandleInput {
    const noise = () => (Math.random() - 0.5) * basePrice * 0.005;
    const open = basePrice + noise();
    const close = open + noise();
    const high = Math.max(open, close) + Math.abs(noise());
    const low = Math.min(open, close) - Math.abs(noise());
    const volume = 100 + Math.random() * 500;
    const now = new Date();
    return {
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toFixed(2),
      openTime: now.toISOString(),
      closeTime: new Date(now.getTime() + 300000).toISOString()
    };
  }

  /* --- Audit --- */
  private recordAudit(action: string, actor: string): void {
    const time = new Date().toISOString();
    const hash = computeCanonicalHash({
      action,
      actor,
      time,
      previous_hash: this.lastHash
    });
    this.lastHash = hash;
    this.auditEntries = [{ action, actor, hash, time }, ...this.auditEntries.slice(0, 49)];
  }

  /* --- State --- */
  public getState(): EngineState {
    return {
      lifecycleState: this.state,
      equity: toDecimalString(this.equity),
      balance: toDecimalString(this.balance),
      dailyRealizedLoss: toDecimalString(this.dailyRealizedLoss),
      activePositionsCount: this.activePositions,
      totalTrades: this.trades,
      uptimeSeconds: this.startedAt > 0 ? Math.floor((Date.now() - this.startedAt) / 1000) : 0,
      auditEntries: this.auditEntries
    };
  }

  /* --- Hydrate from cloud state --- */
  public hydrate(cloudState: {
    equity?: string;
    balance?: string;
    dailyRealizedLoss?: string;
    totalTrades?: number;
    auditEntries?: AuditEntry[];
  }): void {
    if (cloudState.equity) this.equity = parseDecimal(cloudState.equity);
    if (cloudState.balance) this.balance = parseDecimal(cloudState.balance);
    if (cloudState.dailyRealizedLoss) this.dailyRealizedLoss = parseDecimal(cloudState.dailyRealizedLoss);
    if (cloudState.totalTrades) this.trades = cloudState.totalTrades;
    if (cloudState.auditEntries) this.auditEntries = cloudState.auditEntries;
    this.highWaterMark = this.equity;
    this.notify();
  }

  /* --- Observers --- */
  public onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}
