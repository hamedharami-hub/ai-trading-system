import type { Decimal, MarketId, OrderStatus, OrderType, TradeSide, UUIDv7, OrderIntentPayload } from '@trade/contracts';

export type BracketState = 'PENDING_ENTRY' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';

export interface OMSOrder {
  orderId: UUIDv7;
  intentId: UUIDv7;
  candidateId: UUIDv7;
  symbol: MarketId;
  side: TradeSide;
  orderType: OrderType;
  quantity: Decimal;
  limitPrice?: Decimal;
  stopPrice?: Decimal;
  status: OrderStatus;
  filledQuantity: Decimal;
  remainingQuantity: Decimal;
  averageFillPrice?: Decimal;
  expiryCandlesRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BracketOrderGroup {
  bracketId: UUIDv7;
  candidateId: UUIDv7;
  symbol: MarketId;
  side: TradeSide;
  state: BracketState;
  entryOrder: OMSOrder;
  stopLossPrice: Decimal;
  takeProfitPrice: Decimal;
  stopLossOrder?: OMSOrder;
  takeProfitOrder?: OMSOrder;
}

export interface PositionRecord {
  positionId: UUIDv7;
  candidateId: UUIDv7;
  symbol: MarketId;
  side: TradeSide;
  quantity: Decimal;
  entryPrice: Decimal;
  stopLossPrice: Decimal;
  takeProfitPrice: Decimal;
  openedAt: string;
  unrealizedPnl: Decimal;
}
