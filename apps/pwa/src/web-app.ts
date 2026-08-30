import { NodeClient } from './services/node-client.js';
import { DashboardModel } from './components/dashboard-model.js';
import { UIRenderer } from './components/ui-renderer.js';

let client: NodeClient | null = null;
const model = new DashboardModel();

const statusContainer = document.getElementById('status-container');
const killSwitchContainer = document.getElementById('kill-switch-container');
const auditFeedContainer = document.getElementById('audit-feed-container');
const connectionIndicator = document.getElementById('connection-indicator');
const connectBtn = document.getElementById('connect-btn');
const nodeUrlInput = document.getElementById('node-url-input') as HTMLInputElement;
const tokenInput = document.getElementById('token-input') as HTMLInputElement;

function render() {
  const state = model.getState();

  if (statusContainer) {
    statusContainer.innerHTML = UIRenderer.renderStatusBadge(state);
  }

  if (killSwitchContainer) {
    killSwitchContainer.innerHTML = UIRenderer.renderKillSwitch(state);
    const btn = killSwitchContainer.querySelector('button');
    if (btn) {
      btn.onclick = async () => {
        if (!confirm('آیا از توقف اضطراری نود معاملاتی اطمینان دارید؟')) return;
        if (client) {
          try {
            await client.triggerEmergencyStop();
            alert('دستور توقف اضطراری با موفقیت ارسال شد.');
            model.updateState({ lifecycleState: 'STOPPED' });
            render();
          } catch (err) {
            alert(`خطا در ارسال فرمان: ${String(err)}`);
          }
        }
      };
    }
  }

  if (auditFeedContainer) {
    auditFeedContainer.innerHTML = UIRenderer.renderAuditFeed(state);
  }
}

async function connect() {
  const nodeUrl = nodeUrlInput?.value || 'http://127.0.0.1:8765';
  const sessionToken = tokenInput?.value || 'local-secure-token-2026';

  if (connectionIndicator) {
    connectionIndicator.textContent = 'در حال اتصال...';
    connectionIndicator.style.color = '#3b82f6';
  }

  if (client) {
    client.disconnect();
  }

  client = new NodeClient({ nodeUrl, sessionToken });

  client.onEvent((envelope) => {
    model.processEnvelope(envelope);
    render();
  });

  try {
    const initialState = await client.fetchState();
    model.updateState({
      nodeId: initialState.nodeId,
      lifecycleState: initialState.lifecycleState,
      uptimeSeconds: initialState.uptimeSeconds,
      activePositionsCount: initialState.activePositions
    });

    if (connectionIndicator) {
      connectionIndicator.textContent = '● متصل به نود';
      connectionIndicator.style.color = '#10b981';
    }

    client.connectEventStream();
    render();
  } catch (err) {
    if (connectionIndicator) {
      connectionIndicator.textContent = 'خطا در اتصال به نود';
      connectionIndicator.style.color = '#ef4444';
    }
    console.error('Failed to connect to node:', err);
  }
}

connectBtn?.addEventListener('click', () => {
  connect();
});

// Initial render with default state
render();
