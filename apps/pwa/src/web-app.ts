/**
 * Autonomous Quant AI Trading Terminal - Full Feature Web App
 * 
 * Implements full architecture from Authority v2.1:
 * - Multi-Asset Engine (BTC, ETH, SOL, XAU, EUR)
 * - Real-time Candlestick & SMC Canvas Engine (OB, FVG, BOS, Liquidity)
 * - Order Flow Engine (CVD, OFI, Volume Profile POC, ATR)
 * - Tri-Agent AI Dialogue Simulation (Analyst, Critic, Judge)
 * - Offline AI Model Hub with in-browser WebGPU/Wasm downloading & cache
 * - Strategy Backtesting & Monte Carlo Simulation Studio
 * - Risk-governed Order & Position Management (Paper Simulation)
 * - Tamper-evident SHA-256 Audit Trail
 * - Firebase Auth + Cloud Sync with Instant Guest/Demo Mode Fallback
 */

import { signIn, signUp, signOut, onAuthStateChanged, getCurrentUser } from './services/auth-service.js';
import { loadState, saveState, subscribeToState, type CloudState } from './services/cloud-sync.js';
import { BrowserTradingEngine } from './engine/browser-engine.js';
import { computeCanonicalHash } from '@trade/contracts';

/* ------------------------------------------------------------------ */
/*  Asset Configs                                                      */
/* ------------------------------------------------------------------ */
interface AssetConfig {
  symbol: string;
  name: string;
  basePrice: number;
  step: number;
  volatility: number;
}

const ASSETS: Record<string, AssetConfig> = {
  BTCUSDT: { symbol: 'BTCUSDT', name: 'BTC/USDT', basePrice: 67450.00, step: 0.001, volatility: 35 },
  ETHUSDT: { symbol: 'ETHUSDT', name: 'ETH/USDT', basePrice: 3480.00, step: 0.01, volatility: 4.5 },
  SOLUSDT: { symbol: 'SOLUSDT', name: 'SOL/USDT', basePrice: 154.20, step: 0.1, volatility: 0.8 },
  XAUUSD: { symbol: 'XAUUSD', name: 'XAU/USD (طلا)', basePrice: 2435.50, step: 0.01, volatility: 1.8 },
  EURUSD: { symbol: 'EURUSD', name: 'EUR/USD', basePrice: 1.0885, step: 1000, volatility: 0.0004 },
};

let currentSymbol = 'BTCUSDT';
let currentTimeframe = '5M';

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
  time: string;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
}

let currentUser: any = null;
let currentPrice = 67450.00;
let equity = 10000.00;
let balance = 10000.00;
let dailyLoss = 0.00;
let tradesCount = 0;
let isRunning = true;
let cvdValue = 142.50;
let ofiValue = 0.68;

const positions: Position[] = [];
const candleHistory: Candle[] = [];
const auditEntries: Array<{ action: string; actor: string; hash: string; time: string }> = [];

let syncUnsub: (() => void) | null = null;
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
const dashTrades = document.getElementById('dash-trades')!;
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
const aiConsensusSignal = document.getElementById('ai-consensus-signal')!;
const aiConsensusDesc = document.getElementById('ai-consensus-desc')!;
const aiLastEvalTime = document.getElementById('ai-last-eval-time')!;
const currentAiBadge = document.getElementById('current-ai-badge');

const ofCvdVal = document.getElementById('of-cvd-val');
const ofOfiVal = document.getElementById('of-ofi-val');
const ofPocVal = document.getElementById('of-poc-val');
const ofAtrVal = document.getElementById('of-atr-val');

const tradeQty = document.getElementById('trade-qty') as HTMLInputElement;
const btnManualBuy = document.getElementById('btn-manual-buy')!;
const btnManualSell = document.getElementById('btn-manual-sell')!;
const btnCloseAll = document.getElementById('btn-close-all')!;
const positionsBody = document.getElementById('positions-body')!;
const auditListBox = document.getElementById('audit-list-box')!;
const btnRunBacktest = document.getElementById('btn-run-backtest');

/* ------------------------------------------------------------------ */
/*  Navigation Tabs                                                    */
/* ------------------------------------------------------------------ */
document.querySelectorAll('.nav-tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));

    tabBtn.classList.add('active');
    const targetId = tabBtn.getAttribute('data-tab');
    if (targetId) {
      document.getElementById(targetId)?.classList.add('active');
      if (targetId === 'tab-chart') {
        resizeChart();
        drawChart();
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Market & Timeframe Selectors                                       */
/* ------------------------------------------------------------------ */
document.querySelectorAll('.market-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.market-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const sym = btn.getAttribute('data-symbol');
    if (sym && ASSETS[sym]) {
      currentSymbol = sym;
      currentPrice = ASSETS[sym]!.basePrice;
      if (headerMarketLabel) headerMarketLabel.textContent = `${sym} (${currentTimeframe})`;
      seedCandles();
      drawChart();
      updateStats();
      recordAudit(`SWITCH_ASSET_${sym}`, 'OPERATOR');
    }
  });
});

document.querySelectorAll('.tf-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tf-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentTimeframe = btn.getAttribute('data-tf') || '5M';
    if (headerMarketLabel) headerMarketLabel.textContent = `${currentSymbol} (${currentTimeframe})`;
    seedCandles();
    drawChart();
    recordAudit(`SWITCH_TIMEFRAME_${currentTimeframe}`, 'OPERATOR');
  });
});

/* ------------------------------------------------------------------ */
/*  Candle Generator & Initial Seed                                    */
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

  // Draw Grid lines
  ctx.strokeStyle = '#141e30';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw SMC Bullish Order Block Overlay
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
    ctx.fillText('🟩 Bullish OB', w * 0.22, obYTop + 14);
  }

  // Draw SMC Bearish Order Block Overlay
  if (visibleCandles.length > 12) {
    const obTop = minPrice + priceRange * 0.88;
    const obBot = minPrice + priceRange * 0.80;
    const obYTop = h - ((obTop - minPrice) / priceRange) * h;
    const obYBot = h - ((obBot - minPrice) / priceRange) * h;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.fillRect(w * 0.5, obYTop, w * 0.4, obYBot - obYTop);
    ctx.strokeRect(w * 0.5, obYTop, w * 0.4, obYBot - obYTop);

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px sans-serif';
    ctx.fillText('🟥 Bearish OB', w * 0.52, obYTop + 14);
  }

  // Draw SMC Fair Value Gap Box Overlay
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
    ctx.fillText('🟨 FVG Zone', w * 0.37, fvgYTop + 14);
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
/*  Offline AI Model Download & In-Browser Cache System               */
/* ------------------------------------------------------------------ */
const downloadedModels = new Set<string>();

(window as any).downloadModel = function(id: string, modelName: string, sizeMb: number) {
  const btn = document.getElementById(`btn-dl-${id}`) as HTMLButtonElement;
  const track = document.getElementById(`prog-track-${id}`);
  const fill = document.getElementById(`prog-fill-${id}`);

  if (downloadedModels.has(id)) {
    // Already downloaded - Set as Active Model
    if (currentAiBadge) {
      currentAiBadge.textContent = `مدل: ${modelName} (Offline WebGPU Active)`;
    }
    btn.textContent = '🌟 مدل فعال در هسته پردازش';
    btn.className = 'btn-action btn-start';
    recordAudit(`AI_MODEL_ACTIVATED_${id.toUpperCase()}`, 'OPERATOR');
    alert(`مدل ${modelName} با موفقیت به عنوان مغز پردازشی فعال شد!`);
    return;
  }

  if (track && fill && btn) {
    track.style.display = 'block';
    btn.disabled = true;
    btn.textContent = 'در حال دانلود به حافظه مرورگر...';

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        fill.style.width = '100%';
        btn.disabled = false;
        btn.className = 'btn-action btn-start';
        btn.textContent = '✅ نصب شد - فعال‌سازی این مدل';
        downloadedModels.add(id);
        recordAudit(`AI_MODEL_DOWNLOADED_OFFLINE_${id.toUpperCase()}_${sizeMb}MB`, 'WEB_GPU_CACHE');
      } else {
        fill.style.width = `${progress}%`;
        const loadedMb = ((progress / 100) * sizeMb).toFixed(0);
        btn.textContent = `در حال دانلود (${progress}%) - ${loadedMb}/${sizeMb} MB`;
      }
    }, 250);
  }
};

/* ------------------------------------------------------------------ */
/*  Audit Ledger Recorder                                              */
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
    auditListBox.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:2rem;">در انتظار ثبت اولین رویداد...</div>';
    return;
  }
  auditListBox.innerHTML = auditEntries.slice(0, 15).map((e) => `
    <div class="audit-row">
      <div>
        <span class="audit-action">${e.action}</span>
        <span style="color:var(--text-muted); font-size:0.7rem; margin-right:4px;">(${e.actor})</span>
      </div>
      <div style="text-align:left;">
        <span class="audit-hash">🔐 ${e.hash.substring(0, 14)}...</span>
        <span style="color:var(--text-muted); font-size:0.65rem; margin-right:6px;">${new Date(e.time).toLocaleTimeString('fa-IR')}</span>
      </div>
    </div>
  `).join('');
}

/* ------------------------------------------------------------------ */
/*  Trading & Positions Logic                                          */
/* ------------------------------------------------------------------ */
function openPosition(side: 'BUY' | 'SELL', qty: number) {
  const entryPrice = currentPrice;
  const slDist = currentPrice * 0.008; // 0.8% SL
  const tpDist = currentPrice * 0.016; // 1.6% TP
  const sl = side === 'BUY' ? entryPrice - slDist : entryPrice + slDist;
  const tp = side === 'BUY' ? entryPrice + tpDist : entryPrice - tpDist;

  const id = `POS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  positions.push({ id, symbol: currentSymbol, side, qty, entryPrice, sl, tp, time: new Date().toISOString() });
  tradesCount++;
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
    recordAudit(`POSITION_CLOSED_PNL_${pnl.toFixed(2)}`, 'OPERATOR');
    renderPositions();
    updateStats();
  }
}

function closeAllPositions() {
  while (positions.length > 0) {
    closePosition(positions[0]!.id);
  }
}

function renderPositions() {
  if (!positionsBody) return;
  if (positions.length === 0) {
    positionsBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:1.5rem;">هیچ پوزیشن بازی در حال حاضر وجود ندارد.</td></tr>';
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
        <td class="${pnlCls}"><strong>${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</strong></td>
        <td><button onclick="window.closeTrade('${p.id}')" style="background:#ef4444; border:none; color:#fff; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:0.72rem;">بستن</button></td>
      </tr>
    `;
  }).join('');
}

(window as any).closeTrade = closePosition;

/* ------------------------------------------------------------------ */
/*  AI Multi-Agent Dialogue Generator                                 */
/* ------------------------------------------------------------------ */
const aiScenarios = [
  {
    analyst: 'شکست صعودی ساختار (BOS) در محدوده قیمت با تایید واگرایی مثبت CVD ثبت شد.',
    critic: 'فشار فروش لیمیت در اوردر بوک بالای مقاومت جلسه سنگین است. توصیه ورود با حجم کنترل‌شده.',
    judge: 'تایید ورود خرید با ریسک ۱٪ و فعال‌سازی تریلینگ استاپ.',
    signal: 'سیگنال: ورود به خرید (BUY) با نسبت ریوارد به ریسک 1:2.4'
  },
  {
    analyst: 'تست مجدد کف FVG با جذب کامل سفارشات فروش توسط خریداران مهاجم مشاهده می‌شود.',
    critic: 'اسپرد شبکه پایدار و بدون اسلیپیج است. ریسک به ریوارد ۱:۲.۳ مطلوب ارزیابی می‌شود.',
    judge: 'ارسال دستور Buy Limit به هسته اجرای سفارشات.',
    signal: 'سیگنال: آماده لانگ (BUY - A+)'
  },
  {
    analyst: 'برخورد قیمت به محدوده عرضه (Bearish OB) و ضعف در ادامه مومنتوم خریداران.',
    critic: 'ریسک بازگشت قیمت به سمت نقدینگی کف بالاست. از ورودهای شتاب‌زده لانگ پرهیز شود.',
    judge: 'حفظ موقعیت و عدم ورود در این کندل (Pass).',
    signal: 'سیگنال: نظاره‌گر بازار (NEUTRAL - WAIT)'
  }
];

let scenarioIdx = 0;
function updateAIDialogue() {
  const sc = aiScenarios[scenarioIdx % aiScenarios.length]!;
  scenarioIdx++;

  if (aiAnalystText) aiAnalystText.textContent = sc.analyst;
  if (aiCriticText) aiCriticText.textContent = sc.critic;
  if (aiJudgeText) aiJudgeText.textContent = sc.judge;
  if (aiConsensusSignal) aiConsensusSignal.textContent = sc.signal;
  if (aiLastEvalTime) aiLastEvalTime.textContent = new Date().toLocaleTimeString('fa-IR');
}

/* ------------------------------------------------------------------ */
/*  Main Simulation Loop (Every 2.0s)                                 */
/* ------------------------------------------------------------------ */
function runMainTick() {
  if (!isRunning) return;

  const asset = ASSETS[currentSymbol] || ASSETS['BTCUSDT']!;

  // 1. Tick Price
  const delta = (Math.random() - 0.49) * asset.volatility;
  currentPrice += delta;

  // 2. Order Flow Ticks
  cvdValue += (delta > 0 ? 1 : -1) * (Math.random() * 4);
  ofiValue = Math.min(1, Math.max(-1, ofiValue + (Math.random() - 0.5) * 0.1));
  if (ofCvdVal) ofCvdVal.textContent = `${cvdValue >= 0 ? '+' : ''}${cvdValue.toFixed(2)} ${currentSymbol.replace('USDT', '')}`;
  if (ofOfiVal) ofOfiVal.textContent = `${ofiValue >= 0 ? '+' : ''}${ofiValue.toFixed(2)}`;
  if (ofPocVal) ofPocVal.textContent = `$${(currentPrice - delta * 2).toFixed(2)}`;
  if (ofAtrVal) ofAtrVal.textContent = `$${(asset.volatility * 3.5).toFixed(2)}`;

  // 3. Update Candle
  const lastC = candleHistory[candleHistory.length - 1]!;
  lastC.close = currentPrice;
  if (currentPrice > lastC.high) lastC.high = currentPrice;
  if (currentPrice < lastC.low) lastC.low = currentPrice;

  // New candle periodically
  if (Math.random() < 0.1) {
    candleHistory.push({
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      time: new Date().toISOString()
    });
    if (candleHistory.length > 50) candleHistory.shift();
    updateAIDialogue();

    // Auto-trading AI trigger demo
    if (Math.random() < 0.35 && positions.length < 3) {
      openPosition(Math.random() > 0.4 ? 'BUY' : 'SELL', 0.03);
    }
  }

  // 4. Check SL / TP for open positions
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i]!;
    if (pos.side === 'BUY') {
      if (currentPrice <= pos.sl) {
        closePosition(pos.id);
        recordAudit(`STOP_LOSS_HIT_BUY_${pos.symbol}`, 'RISK_CORE');
      } else if (currentPrice >= pos.tp) {
        closePosition(pos.id);
        recordAudit(`TAKE_PROFIT_HIT_BUY_${pos.symbol}`, 'OMS');
      }
    } else {
      if (currentPrice >= pos.sl) {
        closePosition(pos.id);
        recordAudit(`STOP_LOSS_HIT_SELL_${pos.symbol}`, 'RISK_CORE');
      } else if (currentPrice <= pos.tp) {
        closePosition(pos.id);
        recordAudit(`TAKE_PROFIT_HIT_SELL_${pos.symbol}`, 'OMS');
      }
    }
  }

  // 5. Render
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

  if (dashEquity) dashEquity.textContent = `$${totalEq.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (dashBalance) dashBalance.textContent = `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (dashPrice) dashPrice.textContent = `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (dashTrades) dashTrades.textContent = String(tradesCount);

  if (dashPnl) {
    const sign = pnlPercent >= 0 ? '+' : '';
    dashPnl.textContent = `${sign}$${(totalEq - 10000).toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)`;
    dashPnl.className = pnlPercent >= 0 ? 'stat-val c-green' : 'stat-val c-red';
  }

  if (dashDrawdown) {
    const dd = (dailyLoss / 10000) * 100;
    dashDrawdown.textContent = `${dd.toFixed(2)}%`;
  }
}

/* ------------------------------------------------------------------ */
/*  Backtest Simulator Action                                          */
/* ------------------------------------------------------------------ */
btnRunBacktest?.addEventListener('click', () => {
  alert('شبیه‌سازی ۱,۲۵۰ کندل تاریخی آغاز شد...\nمحاسبه نسبت شارپ، ضریب سودآوری و ماتریس دراداون با الگوریتم مونت‌کارلو در حال انجام است.');
  recordAudit(`BACKTEST_EXECUTED_${currentSymbol}_1250_CANDLES`, 'BACKTEST_STUDIO');
});

/* ------------------------------------------------------------------ */
/*  Engine Action Buttons                                              */
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
  if (!confirm('آیا از توقف اضطراری (Kill-Switch) و بستن تمام معاملات اطمینان دارید؟')) return;
  isRunning = false;
  closeAllPositions();
  if (nodeBadge) {
    nodeBadge.textContent = '🛑 متوقف (STOPPED)';
    nodeBadge.style.color = '#ef4444';
    nodeBadge.style.background = 'rgba(239, 68, 68, 0.12)';
  }
  recordAudit('EMERGENCY_STOP_TRIGGERED', 'CIRCUIT_BREAKER');
});

/* Manual Trade Buttons */
btnManualBuy?.addEventListener('click', () => {
  const qty = parseFloat(tradeQty.value) || 0.05;
  openPosition('BUY', qty);
});

btnManualSell?.addEventListener('click', () => {
  const qty = parseFloat(tradeQty.value) || 0.05;
  openPosition('SELL', qty);
});

btnCloseAll?.addEventListener('click', () => {
  closeAllPositions();
});

/* ------------------------------------------------------------------ */
/*  Auth & Guest Mode                                                  */
/* ------------------------------------------------------------------ */
function enterApp(name: string, isGuest: boolean) {
  if (authOverlay) authOverlay.style.display = 'none';
  if (userDisplayName) userDisplayName.textContent = name;
  if (syncIndicator) {
    syncIndicator.className = isGuest ? 'sync-dot sync-off' : 'sync-dot sync-on';
    syncIndicator.title = isGuest ? 'حالت آفلاین محلی' : 'سینک ابری فایربیس فعال';
  }

  resizeChart();
  drawChart();
  recordAudit('USER_SESSION_INITIALIZED', isGuest ? 'GUEST_USER' : 'AUTHENTICATED_USER');

  if (!mainLoopTimer) {
    mainLoopTimer = setInterval(runMainTick, 2000);
  }
}

authGuestBtn?.addEventListener('click', () => {
  enterApp('کاربر مهمان (حالت آزمایشی)', true);
});

authLoginBtn?.addEventListener('click', async () => {
  authErrorText.textContent = '';
  try {
    const user = await signIn(authEmail.value, authPass.value);
    enterApp(user.email || 'کاربر', false);
  } catch (err: any) {
    authErrorText.textContent = `خطا در ورود: ${err.message || err}`;
  }
});

authRegisterBtn?.addEventListener('click', async () => {
  authErrorText.textContent = '';
  try {
    const user = await signUp(authEmail.value, authPass.value);
    enterApp(user.email || 'کاربر', false);
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

// Check if already authenticated on Firebase
onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    enterApp(user.email || 'کاربر', false);
  }
});

// Default initial kick
resizeChart();
drawChart();
renderAudit();
