import { NodeClient } from './services/node-client.js';
import { DashboardModel } from './components/dashboard-model.js';
import { UIRenderer } from './components/ui-renderer.js';

/* ------------------------------------------------------------------ */
/*  Smart node URL detection                                          */
/*  - localhost / 127.0.0.1 → user is on the same machine as the node */
/*  - LAN IP (192.168.x.x)  → same WiFi, node on that host           */
/*  - Vercel / external     → try the saved LAN IP                    */
/* ------------------------------------------------------------------ */
const NODE_PORT = 8765;
const LAN_IP = '192.168.1.68'; // Desktop LAN IP

function detectNodeUrl(): string {
  const h = window.location.hostname;

  // Opened from the desktop itself
  if (h === 'localhost' || h === '127.0.0.1') {
    return `http://127.0.0.1:${NODE_PORT}`;
  }

  // Opened from a LAN IP (could be same or different device on WiFi)
  if (/^192\.168\.\d+\.\d+$/.test(h) || /^10\.\d+\.\d+\.\d+$/.test(h)) {
    // If served from the node machine's own preview server, connect to same host
    return `http://${h}:${NODE_PORT}`;
  }

  // Opened from Vercel (public domain) — connect to the saved LAN IP
  // User can override in the input field
  return `http://${LAN_IP}:${NODE_PORT}`;
}

let client: NodeClient | null = null;
const model = new DashboardModel();

const statusContainer = document.getElementById('status-container');
const killSwitchContainer = document.getElementById('kill-switch-container');
const auditFeedContainer = document.getElementById('audit-feed-container');
const connectionIndicator = document.getElementById('connection-indicator');
const connectBtn = document.getElementById('connect-btn');
const nodeUrlInput = document.getElementById('node-url-input') as HTMLInputElement;
const tokenInput = document.getElementById('token-input') as HTMLInputElement;

// Set detected URL into the input field so the user sees what we're connecting to
if (nodeUrlInput && !nodeUrlInput.value) {
  nodeUrlInput.value = detectNodeUrl();
}

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
  const nodeUrl = nodeUrlInput?.value || detectNodeUrl();
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
      connectionIndicator.textContent = 'خطا در اتصال — نود روشن است؟';
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

// Auto-connect on page load when opened from localhost or LAN
const h = window.location.hostname;
if (h === 'localhost' || h === '127.0.0.1' || /^192\.168\.\d+\.\d+$/.test(h) || /^10\.\d+\.\d+\.\d+$/.test(h)) {
  connect();
}

