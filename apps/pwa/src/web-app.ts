/**
 * Cloud-First PWA Entry Point
 *
 * - Firebase Auth for login/signup
 * - BrowserTradingEngine runs the full simulation in-browser
 * - Firestore syncs state between devices in real-time
 */
import { signIn, signUp, signOut, onAuthStateChanged } from './services/auth-service.js';
import { loadState, saveState, subscribeToState, type CloudState } from './services/cloud-sync.js';
import { BrowserTradingEngine, type EngineState } from './engine/browser-engine.js';
import type { MarketId, Timeframe } from '@trade/contracts';

/* ------------------------------------------------------------------ */
/*  DOM References                                                     */
/* ------------------------------------------------------------------ */
const authPage = document.getElementById('auth-page')!;
const appPage = document.getElementById('app-page')!;
const authEmail = document.getElementById('auth-email') as HTMLInputElement;
const authPassword = document.getElementById('auth-password') as HTMLInputElement;
const authSignInBtn = document.getElementById('auth-signin-btn')!;
const authSignUpBtn = document.getElementById('auth-signup-btn')!;
const authError = document.getElementById('auth-error')!;
const userEmailEl = document.getElementById('user-email')!;
const signoutBtn = document.getElementById('signout-btn')!;
const syncDot = document.getElementById('sync-dot')!;

const engineStatusEl = document.getElementById('engine-status')!;
const statEquity = document.getElementById('stat-equity')!;
const statBalance = document.getElementById('stat-balance')!;
const statLoss = document.getElementById('stat-loss')!;
const statTrades = document.getElementById('stat-trades')!;
const auditFeed = document.getElementById('audit-feed')!;

const btnStart = document.getElementById('btn-start')!;
const btnPause = document.getElementById('btn-pause')!;
const btnStop = document.getElementById('btn-stop')!;

/* ------------------------------------------------------------------ */
/*  Engine Instance                                                    */
/* ------------------------------------------------------------------ */
let engine: BrowserTradingEngine | null = null;
let simulationInterval: ReturnType<typeof setInterval> | null = null;
let syncUnsubscribe: (() => void) | null = null;
let currentUserId: string | null = null;

/* ------------------------------------------------------------------ */
/*  Auth Flow                                                          */
/* ------------------------------------------------------------------ */
authSignInBtn.addEventListener('click', async () => {
  authError.textContent = '';
  try {
    await signIn(authEmail.value, authPassword.value);
  } catch (err: any) {
    authError.textContent = translateAuthError(err.code || err.message);
  }
});

authSignUpBtn.addEventListener('click', async () => {
  authError.textContent = '';
  try {
    await signUp(authEmail.value, authPassword.value);
  } catch (err: any) {
    authError.textContent = translateAuthError(err.code || err.message);
  }
});

signoutBtn.addEventListener('click', async () => {
  stopSimulation();
  if (syncUnsubscribe) syncUnsubscribe();
  await signOut();
});

function translateAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email': 'ایمیل نامعتبر است',
    'auth/user-not-found': 'کاربری با این ایمیل یافت نشد',
    'auth/wrong-password': 'رمز عبور اشتباه است',
    'auth/email-already-in-use': 'این ایمیل قبلاً ثبت شده است',
    'auth/weak-password': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
    'auth/invalid-credential': 'اطلاعات ورود نامعتبر است',
    'auth/too-many-requests': 'تعداد تلاش‌ها زیاد است، لطفاً بعداً امتحان کنید',
  };
  return map[code] || `خطا: ${code}`;
}

/* ------------------------------------------------------------------ */
/*  Auth State Listener                                                */
/* ------------------------------------------------------------------ */
onAuthStateChanged(async (user) => {
  if (user) {
    // Logged in
    authPage.style.display = 'none';
    appPage.style.display = 'flex';
    userEmailEl.textContent = user.email || '';
    currentUserId = user.uid;

    // Initialize engine
    engine = new BrowserTradingEngine({
      symbol: 'BTCUSDT' as MarketId,
      timeframe: '5M' as Timeframe,
      initialBalance: '10000'
    });

    // Load cloud state and hydrate engine
    try {
      const cloudState = await loadState(user.uid);
      engine.hydrate({
        equity: cloudState.equity,
        balance: cloudState.balance,
        dailyRealizedLoss: cloudState.dailyRealizedLoss,
        totalTrades: cloudState.totalTrades,
        auditEntries: cloudState.auditEntries
      });
      syncDot.className = 'sync-dot sync-active';
    } catch (err) {
      console.warn('Cloud sync unavailable, running locally:', err);
      syncDot.className = 'sync-dot sync-offline';
    }

    // Subscribe to real-time sync from other devices
    try {
      syncUnsubscribe = subscribeToState(user.uid, (cloudState: CloudState) => {
        if (engine) {
          engine.hydrate({
            equity: cloudState.equity,
            balance: cloudState.balance,
            dailyRealizedLoss: cloudState.dailyRealizedLoss,
            totalTrades: cloudState.totalTrades,
            auditEntries: cloudState.auditEntries
          });
          renderState(engine.getState());
        }
      });
    } catch {
      // Offline mode — no sync
    }

    // Listen to engine state changes and render
    engine.onChange(() => {
      if (engine) renderState(engine.getState());
    });

    renderState(engine.getState());
  } else {
    // Logged out
    authPage.style.display = 'flex';
    appPage.style.display = 'none';
    stopSimulation();
    engine = null;
    currentUserId = null;
    if (syncUnsubscribe) {
      syncUnsubscribe();
      syncUnsubscribe = null;
    }
  }
});

/* ------------------------------------------------------------------ */
/*  Engine Controls                                                    */
/* ------------------------------------------------------------------ */
btnStart.addEventListener('click', () => {
  if (!engine) return;
  engine.start();
  startSimulation();
});

btnPause.addEventListener('click', () => {
  if (!engine) return;
  engine.pause();
  stopSimulation();
});

btnStop.addEventListener('click', () => {
  if (!engine) return;
  if (!confirm('آیا از توقف اضطراری موتور معاملاتی اطمینان دارید؟')) return;
  engine.emergencyStop();
  stopSimulation();
  syncToCloud();
});

/* ------------------------------------------------------------------ */
/*  Simulation Loop                                                    */
/* ------------------------------------------------------------------ */
function startSimulation(): void {
  stopSimulation();
  if (!engine) return;

  let basePrice = 67500; // Starting BTC price for demo

  simulationInterval = setInterval(() => {
    if (!engine || engine.getState().lifecycleState !== 'RUNNING') return;

    // Generate and process a demo candle
    const candle = engine.generateDemoCandle(basePrice);
    engine.processCandle(candle);

    // Drift the base price slightly
    basePrice += (Math.random() - 0.5) * 50;

    // Sync to cloud every 5 seconds
    syncToCloud();
  }, 3000); // Every 3 seconds
}

function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

async function syncToCloud(): Promise<void> {
  if (!engine || !currentUserId) return;
  const state = engine.getState();
  try {
    await saveState(currentUserId, {
      lifecycleState: state.lifecycleState,
      equity: state.equity,
      balance: state.balance,
      dailyRealizedLoss: state.dailyRealizedLoss,
      activePositionsCount: state.activePositionsCount,
      totalTrades: state.totalTrades,
      auditEntries: state.auditEntries
    });
  } catch {
    // Silently fail — offline mode
  }
}

/* ------------------------------------------------------------------ */
/*  Render State to DOM                                                */
/* ------------------------------------------------------------------ */
function renderState(state: EngineState): void {
  // Status badge
  const statusMap: Record<string, { text: string; cls: string }> = {
    IDLE: { text: '● IDLE', cls: 'status-badge status-idle' },
    RUNNING: { text: '● RUNNING', cls: 'status-badge status-running' },
    PAUSED: { text: '● PAUSED', cls: 'status-badge status-idle' },
    STOPPED: { text: '● STOPPED', cls: 'status-badge status-stopped' },
  };
  const s = statusMap[state.lifecycleState] || statusMap['IDLE']!;
  engineStatusEl.textContent = s.text;
  engineStatusEl.className = s.cls;

  // Stats
  statEquity.textContent = `$${formatNumber(state.equity)}`;
  statBalance.textContent = `$${formatNumber(state.balance)}`;
  statLoss.textContent = `$${formatNumber(state.dailyRealizedLoss)}`;
  statTrades.textContent = String(state.totalTrades);

  // Color equity
  const eqNum = parseFloat(state.equity);
  statEquity.className = eqNum >= 10000 ? 'stat-value stat-green' : 'stat-value stat-red';

  // Audit feed
  if (state.auditEntries.length === 0) {
    auditFeed.innerHTML = '<div class="audit-empty">هنوز رکوردی ثبت نشده است.</div>';
  } else {
    const items = state.auditEntries.slice(0, 15).map((e) => `
      <li class="audit-item">
        <span class="audit-action">${e.action}</span>
        <span>(${e.actor})</span>
        <br>
        <span class="audit-hash">🔐 ${e.hash.substring(0, 16)}...</span>
        <span style="float:left; font-size:0.65rem;">${new Date(e.time).toLocaleTimeString('fa-IR')}</span>
      </li>
    `).join('');
    auditFeed.innerHTML = `<ul class="audit-list">${items}</ul>`;
  }
}

function formatNumber(val: string): string {
  const n = parseFloat(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
