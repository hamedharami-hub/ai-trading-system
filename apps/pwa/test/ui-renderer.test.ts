import { describe, it, expect } from 'vitest';
import { UIRenderer } from '../src/components/ui-renderer.js';
import type { DashboardState } from '../src/services/types.js';

describe('PWA UI Renderer', () => {
  it('renders status badge, emergency kill switch, and audit feed HTML', () => {
    const state: DashboardState = {
      connectionStatus: 'CONNECTED',
      nodeId: 'NODE_PRIMARY_WIN',
      lifecycleState: 'RUNNING',
      uptimeSeconds: 120,
      dailyRealizedLoss: '0.00',
      activePositionsCount: 0,
      recentAuditEvents: [
        {
          audit_id: '018f3a55-0000-7000-8000-000000000001',
          action: 'RISK_APPROVED',
          actor: 'RISK_CORE',
          entity_type: 'STRATEGY_CANDIDATE',
          entity_id: 'CAND_1',
          canonical_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          recorded_at: '2026-08-30T18:00:00.000Z'
        }
      ],
      pendingCandidates: []
    };

    const statusHtml = UIRenderer.renderStatusBadge(state);
    expect(statusHtml).toContain('RUNNING');
    expect(statusHtml).toContain('NODE_PRIMARY_WIN');

    const killSwitchHtml = UIRenderer.renderKillSwitch(state);
    expect(killSwitchHtml).toContain('EMERGENCY STOP');
    expect(killSwitchHtml).not.toContain('disabled');

    const auditHtml = UIRenderer.renderAuditFeed(state);
    expect(auditHtml).toContain('RISK_APPROVED');
    expect(auditHtml).toContain('RISK_CORE');
  });
});
