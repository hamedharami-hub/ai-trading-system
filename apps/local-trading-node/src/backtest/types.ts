import type { Decimal, MarketId, Timeframe, TradeSide, UUIDv7 } from '@trade/contracts';

export interface BacktestConfig {
  symbol: MarketId;
  timeframe: Timeframe;
  initialBalance: string;
  stepSize?: string;
  minQty?: string;
  enableAIValidation?: boolean;
}

export interface CompletedTrade {
  tradeId: UUIDv7;
  candidateId: UUIDv7;
  symbol: MarketId;
  side: TradeSide;
  entryPrice: Decimal;
  exitPrice: Decimal;
  quantity: Decimal;
  realizedPnl: Decimal;
  realizedPnlPercent: Decimal;
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'EXPIRY' | 'MANUAL';
  openedAt: string;
  closedAt: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePercent: Decimal;
  grossProfit: Decimal;
  grossLoss: Decimal;
  netProfit: Decimal;
  profitFactor: Decimal;
  maxDrawdownPercent: Decimal;
  maxConsecutiveLosses: number;
  averageTradePnl: Decimal;
}

export interface BacktestResult {
  config: BacktestConfig;
  metrics: PerformanceMetrics;
  trades: CompletedTrade[];
  finalEquity: Decimal;
  equityCurve: Array<{ timestamp: string; equity: string }>;
}
