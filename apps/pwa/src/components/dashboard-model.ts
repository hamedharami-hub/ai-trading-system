import type { AuditEventPayload, EventEnvelope, StrategyCandidatePayload } from '@trade/contracts';
import type { DashboardState, NodeConnectionStatus } from '../services/types.js';

export class DashboardModel {
  private state: DashboardState = {
    connectionStatus: 'DISCONNECTED',
    nodeId: '',
    lifecycleState: 'IDLE',
    uptimeSeconds: 0,
    dailyRealizedLoss: '0.00',
    activePositionsCount: 0,
    recentAuditEvents: [],
    pendingCandidates: []
  };

  public updateState(partial: Partial<DashboardState>): void {
    this.state = { ...this.state, ...partial };
  }

  public processEnvelope(envelope: EventEnvelope): void {
    if (envelope.event_type === 'AUDIT_EVENT') {
      const payload = envelope.payload as unknown as AuditEventPayload;
      this.state.recentAuditEvents = [payload, ...this.state.recentAuditEvents.slice(0, 49)];
    } else if (envelope.event_type === 'STRATEGY_CANDIDATE') {
      const candidate = envelope.payload as unknown as StrategyCandidatePayload;
      this.state.pendingCandidates.push(candidate);
    } else if (envelope.event_type === 'POLICY_DECISION' || envelope.event_type === 'RISK_DECISION') {
      const payload = envelope.payload as any;
      if (payload.candidate_id) {
        this.state.pendingCandidates = this.state.pendingCandidates.filter(
          (c) => c.candidate_id !== payload.candidate_id
        );
      }
    }
  }

  public getState(): Readonly<DashboardState> {
    return this.state;
  }
}
