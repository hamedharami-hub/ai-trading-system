import type { MarketId, MarketEventPayload, EventEnvelope } from '@trade/contracts';

export type FeedStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'RECONNECTING'
  | 'DEGRADED'
  | 'STALE'
  | 'DISCONNECTED';

export interface FeedHealth {
  symbol: MarketId;
  status: FeedStatus;
  lastMessageTimestampExchange: string | null;
  lastMessageTimestampLocal: string | null;
  latencyMs: number;
  clockOffsetMs: number;
  lastSequenceNumber: number;
  gapCount: number;
  isStale: boolean;
}

export interface MarketDataNormalizer<TRaw = unknown> {
  venue: string;
  normalize(raw: TRaw): MarketEventPayload;
}

export interface FeedSubscription {
  symbol: MarketId;
  channels: Array<'CANDLE' | 'TICK' | 'ORDERBOOK_L2'>;
  timeframe?: string;
}

export interface MarketDataAdapter {
  venueId: 'CTRADER' | 'BINANCE_SPOT' | 'BINANCE_FUTURES';
  getStatus(): FeedStatus;
  getHealth(symbol: MarketId): FeedHealth | undefined;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(sub: FeedSubscription): Promise<void>;
  unsubscribe(symbol: MarketId): Promise<void>;
  onEvent(handler: (event: EventEnvelope) => void): void;
}
