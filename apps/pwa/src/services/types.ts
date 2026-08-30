import type { AuditEventPayload, StrategyCandidatePayload } from '@trade/contracts';

export type NodeConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface PwaConfig {
  nodeUrl: string;
  sessionToken: string;
  autoReconnect?: boolean;
}

export interface DashboardState {
  connectionStatus: NodeConnectionStatus;
  nodeId: string;
  lifecycleState: string;
  uptimeSeconds: number;
  dailyRealizedLoss: string;
  activePositionsCount: number;
  recentAuditEvents: AuditEventPayload[];
  pendingCandidates: StrategyCandidatePayload[];
}
