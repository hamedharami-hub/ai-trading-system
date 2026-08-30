import type { Decimal } from '@trade/contracts';

export interface CandleData {
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: Decimal;
  openTime: string;
  closeTime: string;
}

export interface SwingPoint {
  index: number;
  type: 'HIGH' | 'LOW';
  price: Decimal;
  time: string;
}

export interface OrderBlockData {
  top: Decimal;
  bottom: Decimal;
  type: 'BULLISH' | 'BEARISH';
  mitigated: boolean;
  originIndex: number;
}

export interface FairValueGapData {
  top: Decimal;
  bottom: Decimal;
  type: 'BULLISH' | 'BEARISH';
  mitigated: boolean;
  index: number;
}

export interface LiquiditySweepData {
  sweptLevel: Decimal;
  direction: 'HIGH' | 'LOW';
  index: number;
}
