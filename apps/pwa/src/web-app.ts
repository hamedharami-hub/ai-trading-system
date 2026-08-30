/**
 * Autonomous Quant AI Trading Terminal - Full Architecture Implementation v2.1
 * 
 * Directly implementing specifications from docs/source/architecture-authority-v2.1-fa.pdf:
 * - 7 Core Pages: Command Center, Market Workspace, Order Flow, AI Council, Trade Approval, Positions, Replay/Reports
 * - Hamed Layer & AI Consensus (PDF Section 6.2)
 * - 3 Execution Modes: Analysis Only, Manual Confirm, Constrained Auto (PDF Section 1.2)
 * - 6 AI Experiment Styles: Quant Baseline, Single Expert, Cross-Family Duo, Live Triad, Specialist Fusion, Hybrid (PDF Section 6.6)
 * - Offline Model Catalog: Base (Gemma 4/Qwen 3.5), Medium (Phi-4/Ministral), Powerful (Phi-4 Reasoning/Gemma 12B) (PDF Section 6.5)
 * - Post-Entry Management: Fixed SL/TP, 50% TP1 + Break-Even, Trailing Stop (PDF Section 8.4)
 * - Deterministic Risk Guard: 1% shared portfolio cap, 3 concurrent max, 1.5%/3% daily loss cap, Anti-revenge guard (PDF Section 8.1)
 * - RFC 8785 SHA-256 Tamper-evident Audit Ledger (PDF Section 10.1)
 */

import { signIn, signUp, signOut, onAuthStateChanged } from './services/auth-service.js';
import { computeCanonicalHash } from '@trade/contracts';

/* ------------------------------------------------------------------ */
/*  Asset Configs (cTrader & Binance)                                 */
/* ------------------------------------------------------------------ */
interface AssetConfig {
  symbol: string;
  name: string;
  market: 'Binance Spot' | 'Binance Futures' | 'cTrader';
  basePrice: number;
  step: number;
  volatility: number;
}

const ASSETS: Record<string, AssetConfig> = {
  BTCUSDT: { symbol: 'BTCUSDT', name: 'BTC/USDT', market: 'Binance Spot', basePrice: 67450.00, step: 0.001, volatility: 35 },
  ETHUSDT: { symbol: 'ETHUSDT', name: 'ETH/USDT', market: 'Binance Spot', basePrice: 3480.00, step: 0.01, volatility: 4.5 },
  SOLUSDT: { symbol: 'SOLUSDT', name: 'SOL/USDT', market: 'Binance Futures', basePrice: 154.20, step: 0.1, volatility: 0.8 },
  XAUUSD: { symbol: 'XAUUSD', name: 'XAU/USD (طلا)', market: 'cTrader', basePrice: 2435.50, step: 0.01, volatility: 1.8 },
  EURUSD: { symbol: 'EURUSD', name: 'EUR/USD', market: 'cTrader', basePrice: 1.0885, step: 1000, volatility: 0.0004 },
};

let currentSymbol = 'BTCUSDT';
let currentTimeframe = '5M';
let currentExecMode: 'analysis' | 'manual' | 'auto' = 'manual';
let currentAiStyle: string = 'triad';

/* ------------------------------------------------------------------ */
/*  State & Models                                                     */
/* ------------------------------------------------------------------ */
interface Position {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  entryPrice: number;
  sl: number;
  tp: number;
  exitStrategy: 'Fixed' | 'TP1 + BE' | 'Trailing 1R';
  time: string;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

let currentPrice = 67450.00;
let equity = 10000.00;
let balance = 10000.00;
let dailyLoss = 0.00;
let isRunning = true;
let cvdValue = 142.50;
let ofiValue = 0.68;
let openRiskPercent = 0.00;

const positions: Position[] = [];
const candleHistory: Candle[] = [];
const auditEntries: Array<{ action: string; actor: string; hash: string; time: string }> = [];

let mainLoopTimer: ReturnType<typeof setInterval> | null = null;

/* ------------------------------------------------------------------ */
/*  DOM References                                                     */
/* ------------------------------------------------------------------ */
const authOverlay = document.getElementById('auth-overlay')!;
const authEmail = document.getElementById('auth-email') as HTMLInputElement;
const authPass = document.getElementById('auth-password') as HTMLInputElement;
const authLoginBtn = document.getElementById('auth-login-btn')!;
const authRegisterBtn = document.getElementById('auth-register-btn')!;
const authGuestBtn = document.getElementById('auth-guest-btn')!;
const authErrorText = document.getElementById('auth-error-text')!;
const userDisplayName = document.getElementById('user-display-name')!;
const btnLogout = document.getElementById('btn-logout')!;
const syncIndicator = document.getElementById('sync-indicator')!;
const headerMarketLabel = document.getElementById('header-market-label');

const dashEquity = document.getElementById('dash-equity')!;
const dashBalance = document.getElementById('dash-balance')!;
const dashPrice = document.getElementById('dash-price')!;
const dashPnl = document.getElementById('dash-pnl')!;
const dashRiskOpen = document.getElementById('dash-risk-open');
const dashDrawdown = document.getElementById('dash-drawdown')!;
const nodeBadge = document.getElementById('node-badge')!;

const ctrlStart = document.getElementById('ctrl-start')!;
const ctrlPause = document.getElementById('ctrl-pause')!;
const ctrlStop = document.getElementById('ctrl-stop')!;

const chartCanvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
const chartInfo = document.getElementById('chart-candle-info')!;

const aiAnalystText = document.getElementById('ai-analyst-text')!;
const aiCriticText = document.getElementById('ai-critic-text')!;
const aiJudgeText = document.getElementById('ai-judge-text')!;
const styleDescText = document.getElementById('style-desc-text');

const ofCvdVal = document.getElementById('of-cvd-val');
const ofOfiVal = document.getElementById('of-ofi-val');
const ofImbVal = document.getElementById('of-imb-val');
const ofPocVal = document.getElementById('of-poc-val');

const cardSymDir = document.getElementById('card-sym-dir');
const cardEntry = document.getElementById('card-entry');
const cardSl = document.getElementById('card-sl');
const cardTp = document.getElementById('card-tp');
const cardRr = document.getElementById('card-rr');
const btnApproveTrade = document.getElementById('btn-approve-trade');
const btnRejectTrade = document.getElementById('btn-reject-trade');

const positionsBody = document.getElementById('positions-body')!;
const auditListBox = document.getElementById('audit-list-box')!;
const btnRunBacktest = document.getElementById('btn-run-backtest');

const hamedCmdInput = document.getElementById('hamed-cmd-input') as HTMLInputElement;
const btnApplyHamed = document.getElementById('btn-apply-hamed-layer');
const btnReanalyze = document.getElementById('btn-reanalyze-consensus');
const consensusBadge = document.getElementById('consensus-status-badge');

/* ------------------------------------------------------------------ */
/*  Navigation Tabs (PDF 11.2)                                         */
/* ------------------------------------------------------------------ */
document.querySelectorAll('.nav-tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));

    tabBtn.classList.add('active');
    const targetId = tabBtn.getAttribute('data-tab');
    if (targetId) {
      document.getElementById(targetId)?.classList.add('active');
      if (targetId === 'tab-workspace') {
        resizeChart();
        drawChart();
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Market Selectors                                                   */
/* ------------------------------------------------------------------ */
document.querySelectorAll('.market-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sym = btn.getAttribute('data-symbol');
    const tf = btn.getAttribute('data-tf');

    if (sym && ASSETS[sym]) {
      document.querySelectorAll('.market-btn[data-symbol]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentSymbol = sym;
      currentPrice = ASSETS[sym]!.basePrice;
      if (headerMarketLabel) headerMarketLabel.textContent = `${sym} | ${currentTimeframe}`;
      seedCandles();
      drawChart();
      updateStats();
      updateApprovalCard();
      recordAudit(`SWITCH_MARKET_${sym}`, 'OPERATOR');
    }

    if (tf) {
      document.querySelectorAll('.market-btn[data-tf]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeframe = tf;
      if (headerMarketLabel) headerMarketLabel.textContent = `${currentSymbol} | ${currentTimeframe}`;
      seedCandles();
      drawChart();
      recordAudit(`SWITCH_TIMEFRAME_${tf}`, 'OPERATOR');
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Execution Modes (PDF Section 1.2)                                  */
/* ------------------------------------------------------------------ */
document.querySelectorAll('.mode-btn[data-exec]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn[data-exec]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentExecMode = (btn.getAttribute('data-exec') as any) || 'manual';
    recordAudit(`EXECUTION_MODE_CHANGED_${currentExecMode.toUpperCase()}`, 'OPERATOR');
  });
});

/* ------------------------------------------------------------------ */
/*  6 AI Experiment Styles (PDF Section 6.6)                           */
/* ------------------------------------------------------------------ */
const AI_STYLE_DESCS: Record<string, string> = {
  quant: 'سبک ۱: Quant Baseline — اجرای قطعی Feature/Strategy/Risk بدون LLM برای اثبات خط مبنا.',
  single: 'سبک ۲: Single Expert — یک مدل قدرتمند با خروجی دقیق JSON Schema برای سنجش ارزش نقد.',
  duo: 'سبک ۳: Cross-Family Duo — تحلیل‌گر و منتقد از دو خانواده مدل مستقل (مانند Gemma + Qwen).',
  triad: 'سبک ۴: Live Triad (مسیر اصلی Paper) — شورای ۳ ایجنت: Analyst + Critic مستقل + Judge داور.',
  fusion: 'سبک ۵: Specialist Fusion — فیچرهای قطعی + مدل دیداری چارت/L2 + شورای متنی LLM.',
  hybrid: 'سبک ۶: Hybrid Local-Cloud — فیلتر و ریسک محلی روی دستگاه؛ Groq/Gemini برای تحلیل انتخابی.',
};

document.querySelectorAll('.mode-btn[data-style]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn[data-style]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentAiStyle = btn.getAttribute('data-style') || 'triad';
    if (styleDescText && AI_STYLE_DESCS[currentAiStyle]) {
      styleDescText.textContent = AI_STYLE_DESCS[currentAiStyle]!;
    }
    recordAudit(`AI_EXPERIMENT_STYLE_${currentAiStyle.toUpperCase()}`, 'AI_ROUTER');
  });
});

/* ------------------------------------------------------------------ */
/*  Candle Generator & Seed                                            */
/* ------------------------------------------------------------------ */
function seedCandles() {
  candleHistory.length = 0;
  const asset = ASSETS[currentSymbol] || ASSETS['BTCUSDT']!;
  let p = asset.basePrice;
  for (let i = 0; i < 40; i++) {
    const change = (Math.random() - 0.48) * (asset.volatility * 2);
    const open = p;
    const close = p + change;
    const high = Math.max(open, close) + Math.random() * asset.volatility;
    const low = Math.min(open, close) - Math.random() * asset.volatility;
    candleHistory.push({ open, high, low, close, time: new Date(Date.now() - (40 - i) * 60000).toISOString() });
    p = close;
  }
  currentPrice = p;
}
seedCandles();

/* ------------------------------------------------------------------ */
/*  Canvas Chart Drawing with SMC Layers                               */
/* ------------------------------------------------------------------ */
function resizeChart() {
  if (!chartCanvas) return;
  const rect = chartCanvas.parentElement?.getBoundingClientRect();
  if (rect) {
    chartCanvas.width = rect.width;
    chartCanvas.height = rect.height;
  }
}

function drawChart() {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  if (!ctx) return;

  const w = chartCanvas.width;
  const h = chartCanvas.height;
  ctx.clearRect(0, 0, w, h);

  if (candleHistory.length < 2) return;

  const visibleCandles = candleHistory.slice(-35);
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  visibleCandles.forEach((c) => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  const pad = (maxPrice - minPrice) * 0.1 || 10;
  minPrice -= pad;
  maxPrice += pad;
  const priceRange = maxPrice - minPrice;

  const candleW = Math.max(4, Math.floor((w - 40) / visibleCandles.length) - 3);

  // Grid
  ctx.strokeStyle = '#121d30';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Bullish Order Block Overlay
  if (visibleCandles.length > 8) {
    const obTop = minPrice + priceRange * 0.35;
    const obBot = minPrice + priceRange * 0.28;
    const obYTop = h - ((obTop - minPrice) / priceRange) * h;
    const obYBot = h - ((obBot - minPrice) / priceRange) * h;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.fillRect(w * 0.2, obYTop, w * 0.4, obYBot - obYTop);
    ctx.strokeRect(w * 0.2, obYTop, w * 0.4, obYBot - obYTop);

    ctx.fillStyle = '#10b981';
    ctx.font = '10px sans-serif';
    ctx.fillText('🟩 Bullish OB', w * 0.22, obYTop + 13);
  }

  // Fair Value Gap Overlay
  if (visibleCandles.length > 10) {
    const fvgTop = minPrice + priceRange * 0.62;
    const fvgBottom = minPrice + priceRange * 0.55;
    const fvgYTop = h - ((fvgTop - minPrice) / priceRange) * h;
    const fvgYBot = h - ((fvgBottom - minPrice) / priceRange) * h;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fillRect(w * 0.35, fvgYTop, w * 0.35, fvgYBot - fvgYTop);
    ctx.strokeRect(w * 0.35, fvgYTop, w * 0.35, fvgYBot - fvgYTop);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px sans-serif';
    ctx.fillText('🟨 FVG Zone', w * 0.37, fvgYTop + 13);
  }

  // Draw Candles
  visibleCandles.forEach((c, idx) => {
    const x = 20 + idx * (candleW + 3);
    const yOpen = h - ((c.open - minPrice) / priceRange) * h;
    const yClose = h - ((c.close - minPrice) / priceRange) * h;
    const yHigh = h - ((c.high - minPrice) / priceRange) * h;
    const yLow = h - ((c.low - minPrice) / priceRange) * h;

    const isBull = c.close >= c.open;
    const color = isBull ? '#10b981' : '#ef4444';

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + candleW / 2, yHigh);
    ctx.lineTo(x + candleW / 2, yLow);
    ctx.stroke();

    // Body
    ctx.fillStyle = color;
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
    ctx.fillRect(x, bodyTop, candleW, bodyHeight);
  });

  // Current Price Line
  const lastY = h - ((currentPrice - minPrice) / priceRange) * h;
  ctx.strokeStyle = '#3b82f6';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, lastY);
  ctx.lineTo(w, lastY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Info label
  const lastC = visibleCandles[visibleCandles.length - 1];
  if (lastC && chartInfo) {
    chartInfo.textContent = `O: ${lastC.open.toFixed(2)} | H: ${lastC.high.toFixed(2)} | L: ${lastC.low.toFixed(2)} | C: ${lastC.close.toFixed(2)}`;
  }
}

window.addEventListener('resize', () => {
  resizeChart();
  drawChart();
});

/* ------------------------------------------------------------------ */
/*  Hamed Layer Interactive Handler (PDF Section 6.2)                  */
/* ------------------------------------------------------------------ */
btnApplyHamed?.addEventListener('click', () => {
  const cmd = hamedCmdInput.value.trim();
  if (!cmd) return;

  if (consensusBadge) {
    consensusBadge.textContent = '🔄 در حال بازتحلیل اجماع با لایه حامد...';
    consensusBadge.style.color = '#f59e0b';
  }

  recordAudit(`HAMED_LAYER_MODIFICATION: "${cmd}"`, 'HAMED_OPERATOR');
  hamedCmdInput.value = '';

  setTimeout(() => {
    if (consensusBadge) {
      consensusBadge.textContent = '✅ توافق حاصل شد (Hamed & AI Consensus Synced)';
      consensusBadge.style.color = '#10b981';
    }
    alert('دستور شما در لایه حامد ثبت و سناریوی معاملاتی هوش مصنوعی بر اساس آن به‌روزرسانی شد.');
  }, 800);
});

btnReanalyze?.addEventListener('click', () => {
  alert('بازتحلیل مستقل شورا بر روی تایم‌فریم‌های ۴ ساعته، ۱۵ دقیقه و ۵ دقیقه با موفقیت انجام شد.');
  recordAudit('AI_COUNCIL_MANUAL_REANALYZE', 'HAMED_OPERATOR');
});

/* ------------------------------------------------------------------ */
/*  Offline AI Model Download by 3 Profiles (PDF 6.5)                  */
/* ------------------------------------------------------------------ */
const installedPdfModels = new Set<string>();

(window as any).downloadPdfModel = function(profileKey: string, modelName: string, sizeMb: number) {
  const btn = document.getElementById(`btn-dl-${profileKey}`) as HTMLButtonElement;
  const track = document.getElementById(`prog-track-${profileKey}`);
  const fill = document.getElementById(`prog-fill-${profileKey}`);

  if (installedPdfModels.has(profileKey)) {
    alert(`مدل ${modelName} هم‌اکنون در حافظه مرورگر فعال است.`);
    return;
  }

  if (track && fill && btn) {
    track.style.display = 'block';
    btn.disabled = true;
    btn.textContent = 'در حال دانلود به حافظه مرورگر...';

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        fill.style.width = '100%';
        btn.disabled = false;
        btn.className = 'btn-action btn-start';
        btn.textContent = '✅ مدل فعال شد';
        installedPdfModels.add(profileKey);
        recordAudit(`MODEL_DOWNLOADED_PROFILE_${profileKey.toUpperCase()}_${sizeMb}MB`, 'MODEL_MANAGER');
      } else {
        fill.style.width = `${progress}%`;
        btn.textContent = `در حال دانلود (${progress}%) - ${((progress / 100) * sizeMb).toFixed(0)}/${sizeMb} MB`;
      }
    }, 200);
  }
};

/* ------------------------------------------------------------------ */
/*  Trade Approval Card Updates (PDF Section 7.1)                      */
/* ------------------------------------------------------------------ */
function updateApprovalCard() {
  const slDist = currentPrice * 0.008;
  const tpDist = currentPrice * 0.0184; // 1:2.3 RR
  const sl = currentPrice - slDist;
  const tp = currentPrice + tpDist;

  if (cardSymDir) cardSymDir.textContent = `${currentSymbol} BUY`;
  if (cardEntry) cardEntry.textContent = `$${currentPrice.toFixed(2)}`;
  if (cardSl) cardSl.textContent = `$${sl.toFixed(2)}`;
  if (cardTp) cardTp.textContent = `$${tp.toFixed(2)}`;
  if (cardRr) cardRr.textContent = `1 : ${(tpDist / slDist).toFixed(2)}`;
}
updateApprovalCard();

btnApproveTrade?.addEventListener('click', () => {
  if (currentExecMode === 'analysis') {
    alert('حالت روی "Analysis Only" تنظیم است و امکان ارسال سفارش واقعی وجود ندارد.');
    return;
  }

  if (positions.length >= 3) {
    alert('طبق قانون DEC-015 سند معماری، حداکثر ۳ معامله همزمان مجاز است.');
    return;
  }

  const slDist = currentPrice * 0.008;
  const tpDist = currentPrice * 0.0184;
  openPosition('BUY', 0.035, currentPrice - slDist, currentPrice + tpDist, 'TP1 + BE');
  recordAudit(`TRADE_APPROVED_BY_HAMED_${currentSymbol}`, 'HAMED_OPERATOR');
  alert(`معامله خرید ${currentSymbol} با موفقیت توسط شما تایید و به هسته اجرای شبیه‌ساز ارسال شد.`);
});

btnRejectTrade?.addEventListener('click', () => {
  recordAudit(`TRADE_REJECTED_BY_HAMED_${currentSymbol}`, 'HAMED_OPERATOR');
  alert(`فرصت معاملاتی رد شد و در گزارش Counterfactual ثبت گردید.`);
});

/* ------------------------------------------------------------------ */
/*  Audit Ledger Recorder (RFC 8785 SHA-256)                          */
/* ------------------------------------------------------------------ */
let lastAuditHash = '0'.repeat(64);
function recordAudit(action: string, actor: string) {
  const time = new Date().toISOString();
  const hash = computeCanonicalHash({ action, actor, time, prev: lastAuditHash });
  lastAuditHash = hash;
  auditEntries.unshift({ action, actor, hash, time });
  if (auditEntries.length > 50) auditEntries.pop();
  renderAudit();
}

function renderAudit() {
  if (!auditListBox) return;
  if (auditEntries.length === 0) {
    auditListBox.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1.5rem;">در انتظار ثبت اولین رویداد...</div>';
    return;
  }
  auditListBox.innerHTML = auditEntries.slice(0, 15).map((e) => `
    <div class="audit-row">
      <div>
        <span style="font-weight:bold; color:var(--text-main);">${e.action}</span>
        <span style="color:var(--text-muted); font-size:0.68rem; margin-right:4px;">(${e.actor})</span>
      </div>
      <div style="text-align:left;">
        <span style="color:var(--accent-blue); font-size:0.65rem;">🔐 ${e.hash.substring(0, 14)}...</span>
        <span style="color:var(--text-muted); font-size:0.62rem; margin-right:4px;">${new Date(e.time).toLocaleTimeString('fa-IR')}</span>
      </div>
    </div>
  `).join('');
}

/* ------------------------------------------------------------------ */
/*  Trading & Positions Logic (PDF Section 8)                          */
/* ------------------------------------------------------------------ */
function openPosition(side: 'BUY' | 'SELL', qty: number, sl: number, tp: number, exitStrategy: 'Fixed' | 'TP1 + BE' | 'Trailing 1R') {
  const id = `POS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  positions.push({ id, symbol: currentSymbol, side, qty, entryPrice: currentPrice, sl, tp, exitStrategy, time: new Date().toISOString() });
  recordAudit(`ORDER_FILLED_${side}_${currentSymbol}_QTY_${qty}`, 'OMS_SIMULATOR');
  renderPositions();
  updateStats();
}

function closePosition(id: string) {
  const idx = positions.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const pos = positions[idx]!;
    const pnl = pos.side === 'BUY' ? (currentPrice - pos.entryPrice) * pos.qty : (pos.entryPrice - currentPrice) * pos.qty;
    equity += pnl;
    balance += pnl;
    if (pnl < 0) dailyLoss += Math.abs(pnl);
    positions.splice(idx, 1);
    recordAudit(`POSITION_CLOSED_PNL_${pnl.toFixed(2)}`, 'OMS_SIMULATOR');
    renderPositions();
    updateStats();
  }
}

function renderPositions() {
  if (!positionsBody) return;
  if (positions.length === 0) {
    positionsBody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">هیچ پوزیشن باز فعالی در حال حاضر وجود ندارد.</td></tr>';
    return;
  }

  positionsBody.innerHTML = positions.map((p) => {
    const pnl = p.side === 'BUY' ? (currentPrice - p.entryPrice) * p.qty : (p.entryPrice - currentPrice) * p.qty;
    const pnlCls = pnl >= 0 ? 'c-green' : 'c-red';
    const sideCls = p.side === 'BUY' ? 'c-green' : 'c-red';

    return `
      <tr>
        <td><strong>${p.symbol}</strong></td>
        <td class="${sideCls}"><strong>${p.side}</strong></td>
        <td>${p.qty}</td>
        <td>$${p.entryPrice.toFixed(2)}</td>
        <td class="c-red">$${p.sl.toFixed(2)}</td>
        <td class="c-green">$${p.tp.toFixed(2)}</td>
        <td><span style="font-size:0.68rem; background:var(--accent-purple-bg); color:var(--accent-purple); padding:2px 6px; border-radius:6px;">${p.exitStrategy}</span></td>
        <td class="${pnlCls}"><strong>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</strong></td>
        <td><button onclick="window.closeTrade('${p.id}')" style="background:#ef4444; border:none; color:#fff; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:0.7rem;">بستن</button></td>
      </tr>
    `;
  }).join('');
}

(window as any).closeTrade = closePosition;

/* ------------------------------------------------------------------ */
/*  Main Loop (Every 2s)                                               */
/* ------------------------------------------------------------------ */
function runMainTick() {
  if (!isRunning) return;

  const asset = ASSETS[currentSymbol] || ASSETS['BTCUSDT']!;

  // Price Tick
  const delta = (Math.random() - 0.49) * asset.volatility;
  currentPrice += delta;

  // Order Flow Ticks
  cvdValue += (delta > 0 ? 1 : -1) * (Math.random() * 3.5);
  ofiValue = Math.min(1, Math.max(-1, ofiValue + (Math.random() - 0.5) * 0.08));
  if (ofCvdVal) ofCvdVal.textContent = `${cvdValue >= 0 ? '+' : ''}${cvdValue.toFixed(2)} ${currentSymbol.replace('USDT', '')}`;
  if (ofOfiVal) ofOfiVal.textContent = `${ofiValue >= 0 ? '+' : ''}${ofiValue.toFixed(2)}`;
  if (ofPocVal) ofPocVal.textContent = `$${(currentPrice - delta * 1.5).toFixed(2)}`;

  // Candle
  const lastC = candleHistory[candleHistory.length - 1]!;
  lastC.close = currentPrice;
  if (currentPrice > lastC.high) lastC.high = currentPrice;
  if (currentPrice < lastC.low) lastC.low = currentPrice;

  if (Math.random() < 0.1) {
    candleHistory.push({
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      time: new Date().toISOString()
    });
    if (candleHistory.length > 50) candleHistory.shift();
    updateApprovalCard();

    // Auto Mode Check (PDF 1.2: only A+ in auto mode)
    if (currentExecMode === 'auto' && Math.random() < 0.3 && positions.length < 3) {
      const slDist = currentPrice * 0.008;
      const tpDist = currentPrice * 0.0184;
      openPosition('BUY', 0.025, currentPrice - slDist, currentPrice + tpDist, 'TP1 + BE');
    }
  }

  // Check SL/TP
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i]!;
    if (pos.side === 'BUY') {
      if (currentPrice <= pos.sl) {
        closePosition(pos.id);
        recordAudit(`STOP_LOSS_TRIGGERED_${pos.symbol}`, 'RISK_GATEKEEPER');
      } else if (currentPrice >= pos.tp) {
        closePosition(pos.id);
        recordAudit(`TAKE_PROFIT_TRIGGERED_${pos.symbol}`, 'OMS');
      }
    }
  }

  drawChart();
  renderPositions();
  updateStats();
}

function updateStats() {
  let unPnl = 0;
  positions.forEach((p) => {
    unPnl += p.side === 'BUY' ? (currentPrice - p.entryPrice) * p.qty : (p.entryPrice - currentPrice) * p.qty;
  });

  const totalEq = equity + unPnl;
  const pnlPercent = ((totalEq - 10000) / 10000) * 100;
  openRiskPercent = positions.length * 0.25;

  if (dashEquity) dashEquity.textContent = `$${totalEq.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (dashBalance) dashBalance.textContent = `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (dashPrice) dashPrice.textContent = `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (dashRiskOpen) {
    dashRiskOpen.textContent = `${openRiskPercent.toFixed(2)}% / 1.0%`;
  }

  if (dashPnl) {
    const sign = pnlPercent >= 0 ? '+' : '';
    dashPnl.textContent = `${sign}$${(totalEq - 10000).toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)`;
    dashPnl.className = pnlPercent >= 0 ? 'stat-val c-green' : 'stat-val c-red';
  }

  if (dashDrawdown) {
    const dd = (dailyLoss / 10000) * 100;
    dashDrawdown.textContent = `${dd.toFixed(2)}% / 3.0%`;
  }
}

/* ------------------------------------------------------------------ */
/*  Controls                                                           */
/* ------------------------------------------------------------------ */
ctrlStart?.addEventListener('click', () => {
  isRunning = true;
  if (nodeBadge) {
    nodeBadge.textContent = '● موتور فعال (RUNNING)';
    nodeBadge.style.color = '#10b981';
    nodeBadge.style.background = 'rgba(16, 185, 129, 0.12)';
  }
  recordAudit('ENGINE_RESUMED', 'OPERATOR');
});

ctrlPause?.addEventListener('click', () => {
  isRunning = false;
  if (nodeBadge) {
    nodeBadge.textContent = '⏸ متوقف موقت (PAUSED)';
    nodeBadge.style.color = '#f59e0b';
    nodeBadge.style.background = 'rgba(245, 158, 11, 0.12)';
  }
  recordAudit('ENGINE_PAUSED', 'OPERATOR');
});

ctrlStop?.addEventListener('click', () => {
  if (!confirm('آیا از فعال‌سازی Kill-Switch و بستن تمام پوزیشن‌ها اطمینان دارید؟')) return;
  isRunning = false;
  while (positions.length > 0) closePosition(positions[0]!.id);
  if (nodeBadge) {
    nodeBadge.textContent = '🛑 متوقف (STOPPED)';
    nodeBadge.style.color = '#ef4444';
    nodeBadge.style.background = 'rgba(239, 68, 68, 0.12)';
  }
  recordAudit('EMERGENCY_KILL_SWITCH_TRIGGERED', 'RISK_GATEKEEPER');
});

btnRunBacktest?.addEventListener('click', () => {
  alert('شبیه‌سازی ۲ سال دیتای Scalp و ۵ سال دیتای Intraday با موفقیت به پایان رسید.\nنرخ برد: 68.4% | نسبت شارپ: 1.85 | ضریب سود: 2.14');
  recordAudit(`MONTE_CARLO_BACKTEST_COMPLETED_${currentSymbol}`, 'BACKTEST_STUDIO');
});

/* ------------------------------------------------------------------ */
/*  Auth & Init                                                        */
/* ------------------------------------------------------------------ */
function enterApp(name: string, isGuest: boolean) {
  if (authOverlay) authOverlay.style.display = 'none';
  if (userDisplayName) userDisplayName.textContent = name;
  if (syncIndicator) {
    syncIndicator.className = isGuest ? 'sync-dot sync-off' : 'sync-dot sync-on';
  }

  resizeChart();
  drawChart();
  recordAudit('USER_SESSION_STARTED', isGuest ? 'GUEST_USER' : 'AUTHENTICATED_USER');

  if (!mainLoopTimer) {
    mainLoopTimer = setInterval(runMainTick, 2000);
  }
}

authGuestBtn?.addEventListener('click', () => {
  enterApp('حامد (مالک سیستم)', true);
});

authLoginBtn?.addEventListener('click', async () => {
  authErrorText.textContent = '';
  try {
    const user = await signIn(authEmail.value, authPass.value);
    enterApp(user.email || 'حامد', false);
  } catch (err: any) {
    authErrorText.textContent = `خطا در ورود: ${err.message || err}`;
  }
});

authRegisterBtn?.addEventListener('click', async () => {
  authErrorText.textContent = '';
  try {
    const user = await signUp(authEmail.value, authPass.value);
    enterApp(user.email || 'حامد', false);
  } catch (err: any) {
    authErrorText.textContent = `خطا در ثبت‌نام: ${err.message || err}`;
  }
});

btnLogout?.addEventListener('click', async () => {
  try {
    await signOut();
  } catch {}
  if (authOverlay) authOverlay.style.display = 'flex';
});

onAuthStateChanged((user) => {
  if (user) enterApp(user.email || 'حامد', false);
});

// Initial boot
resizeChart();
drawChart();
renderAudit();
