import type { DashboardState } from '../services/types.js';

export class UIRenderer {
  public static renderStatusBadge(state: DashboardState): string {
    const isRunning = state.lifecycleState === 'RUNNING';
    const color = isRunning ? '#10b981' : '#ef4444';
    return `
      <div class="node-status-badge" style="border: 1px solid ${color}; padding: 8px; border-radius: 4px;">
        <span class="status-indicator" style="color: ${color}; font-weight: bold;">● ${state.lifecycleState}</span>
        <span class="node-id">Node: ${state.nodeId || 'Connecting...'}</span>
        <span class="loss-display">Daily Loss: $${state.dailyRealizedLoss}</span>
      </div>
    `.trim();
  }

  public static renderKillSwitch(state: DashboardState): string {
    const disabled = state.lifecycleState === 'STOPPED';
    return `
      <button id="emergency-kill-switch" 
              class="btn-danger" 
              style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; font-weight: bold;"
              ${disabled ? 'disabled' : ''}>
        🛑 EMERGENCY STOP
      </button>
    `.trim();
  }

  public static renderAuditFeed(state: DashboardState): string {
    if (state.recentAuditEvents.length === 0) {
      return `<div class="audit-empty">No audit records received yet.</div>`;
    }

    const items = state.recentAuditEvents.slice(0, 10).map((ev) => `
      <li class="audit-item" style="font-family: monospace; margin-bottom: 4px;">
        <span class="audit-time">[${ev.recorded_at}]</span>
        <span class="audit-action" style="font-weight: bold;">${ev.action}</span>
        <span class="audit-actor">(${ev.actor})</span>
        <span class="audit-hash" title="${ev.canonical_hash}">Hash: ${ev.canonical_hash.substring(0, 12)}...</span>
      </li>
    `).join('');

    return `<ul class="audit-feed" style="list-style: none; padding: 0;">${items}</ul>`;
  }
}
