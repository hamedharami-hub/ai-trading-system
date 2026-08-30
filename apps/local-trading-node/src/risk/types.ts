import type { Decimal, MarketId, TradeSide } from '@trade/contracts';

export type DrawdownState = 'NORMAL' | 'HALVED_RISK' | 'STOPPED_NEW_ENTRIES';

export interface RiskCoreConfig {
  baseRiskPercent: string; // Default: "0.0100" (1.0%)
  maxRiskPercent: string; // Default: "0.0100"
  dailyLossLimitPercent: string; // Default: "0.0300" (3.0%)
  maxDrawdownLimitPercent: string; // Default: "0.0600" (6.0%)
  maxConcurrentPositions: number; // Default: 3 (DEC-015)
  maxPortfolioRiskPercent: string; // Default: "0.0300" (3.0%)
  consecutiveLossThreshold: number; // Default: 3
}

export interface OpenPosition {
  symbol: MarketId;
  side: TradeSide;
  quantity: Decimal;
  entryPrice: Decimal;
  stopLossPrice: Decimal;
  riskAmount: Decimal;
  riskPercent: Decimal;
}

export interface AccountState {
  equity: Decimal;
  balance: Decimal;
  highWaterMark: Decimal;
  dailyRealizedLoss: Decimal;
  openPositions: OpenPosition[];
  consecutiveLosses: number;
}
