import type { MarketId, Timeframe, EventEnvelope } from '@trade/contracts';

export type NodeLifecycleState = 'IDLE' | 'STARTING' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR';

export interface RunnerConfig {
  nodeId: string;
  host: string;
  port: number;
  sessionToken: string;
  symbol: MarketId;
  timeframe: Timeframe;
  initialBalance: string;
}

export interface BridgeStateResponse {
  nodeId: string;
  lifecycleState: NodeLifecycleState;
  uptimeSeconds: number;
  activePositions: number;
  dailyRealizedLoss: string;
  feedHealthy: boolean;
}

export interface IUIBridge {
  start(): Promise<void>;
  stop(): Promise<void>;
  broadcast(event: EventEnvelope): void;
}
