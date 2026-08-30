import { describe, it, expect } from 'vitest';
import { ClockSyncTracker } from '../../src/feed/clock-sync.js';
import { SequenceTracker } from '../../src/feed/sequence-tracker.js';
import { CandidateGrader } from '../../src/strategies/grading.js';
import { DrawdownMonitor } from '../../src/risk/drawdown-monitor.js';
import { ExposureController } from '../../src/risk/exposure-controller.js';
import { RiskCore, DEFAULT_RISK_CONFIG } from '../../src/risk/risk-core.js';
import type { StrategyCandidatePayload } from '@trade/contracts';
import { Decimal } from '@trade/contracts';

describe('Chaos & Resilience Test Suite', () => {
  it('detects clock drift and degrades feed health when drift exceeds 500ms', () => {
    const clock = new ClockSyncTracker({ maxDriftMs: 500, staleThresholdMs: 5000, alpha: 1.0 });
    const now = Date.now();

    // 1. Normal latency (50ms)
    clock.recordSample(new Date(now - 50).toISOString(), now);
    expect(clock.isDriftExceeded()).toBe(false);

    // 2. High latency / drift (600ms > 500ms threshold)
    clock.recordSample(new Date(now - 600).toISOString(), now);
    expect(clock.isDriftExceeded()).toBe(true);
  });

  it('detects sequence gaps in market data packet delivery', () => {
    const tracker = new SequenceTracker();
    const res1 = tracker.ingest(1, { seq: 1 });
    expect(res1.status).toBe('IN_SYNC');

    const res2 = tracker.ingest(2, { seq: 2 });
    expect(res2.status).toBe('IN_SYNC');

    // Sequence jump (gap from 2 to 5)
    const res3 = tracker.ingest(5, { seq: 5 });
    expect(res3.status).toBe('BUFFERED');
  });

  it('rejects strategy candidates deterministically when market spread is WIDE', () => {
    const featureSnapshot = {
      symbol: 'BTCUSDT',
      timeframe: '5M',
      smc: {
        bos: true,
        choch: false,
        displacement: true
      },
      order_flow: {
        ofi: '0.00',
        cvd: '150.00',
        spread_state: 'WIDE' as const
      },
      secondary_filters: {
        atr: '25.00',
        vwap: '65000.00',
        volume_profile_poc: '65020.00'
      },
      evidence_candle_time: new Date().toISOString()
    };

    const res = CandidateGrader.grade({
      side: 'BUY',
      calculatedRR: '2.50',
      minRR: '1.50',
      featureSnapshot: featureSnapshot as any
    });

    expect(res.grade).toBe('REJECTED');
    expect(res.reason).toContain('Market spread is WIDE');
  });

  it('throttles risk on 3 consecutive losses and halts trading on daily loss cap / max drawdown', () => {
    const monitor = new DrawdownMonitor(DEFAULT_RISK_CONFIG);
    const initialEq = new Decimal('10000');

    // 1. Three consecutive losses -> HALVED_RISK (0.5% risk base)
    const s1 = monitor.evaluate({
      equity: new Decimal('9700'),
      balance: new Decimal('9700'),
      highWaterMark: initialEq,
      dailyRealizedLoss: new Decimal('100'),
      openPositions: [],
      consecutiveLosses: 3
    });
    expect(s1.state).toBe('HALVED_RISK');
    expect(s1.effectiveRiskPercent.toString()).toBe('0.005');

    // 2. Daily loss reaches $300 on $10,000 (3.0% daily loss cap)
    const s2 = monitor.evaluate({
      equity: new Decimal('9700'),
      balance: new Decimal('9700'),
      highWaterMark: initialEq,
      dailyRealizedLoss: new Decimal('301'), // > 3% daily loss
      openPositions: [],
      consecutiveLosses: 1
    });
    expect(s2.state).toBe('STOPPED_NEW_ENTRIES');
    expect(s2.effectiveRiskPercent.toString()).toBe('0');

    // 3. Max drawdown reaches 6.0% (Equity = $9390 on $10,000 HWM)
    const s3 = monitor.evaluate({
      equity: new Decimal('9390'), // > 6% drawdown
      balance: new Decimal('9390'),
      highWaterMark: initialEq,
      dailyRealizedLoss: new Decimal('100'),
      openPositions: [],
      consecutiveLosses: 1
    });
    expect(s3.state).toBe('STOPPED_NEW_ENTRIES');
    expect(s3.effectiveRiskPercent.toString()).toBe('0');
  });

  it('blocks new positions when max concurrent exposure limit (3) is reached', () => {
    const exposure = new ExposureController(DEFAULT_RISK_CONFIG);
    const candidate: StrategyCandidatePayload = {
      candidate_id: '018f3a55-0000-7000-8000-000000000001',
      engine_type: 'SCALP',
      symbol: 'ETHUSDT',
      side: 'BUY',
      grade: 'A',
      entry_price: '3000',
      invalidation_price: '2950',
      target_price: '3100',
      risk_reward_ratio: '2.00',
      expiry_candles: 3,
      generated_at: new Date().toISOString()
    };

    const openPositions: any[] = [
      { symbol: 'BTCUSDT', side: 'BUY', quantity: new Decimal('0.1'), entryPrice: new Decimal('65000'), stopLossPrice: new Decimal('64000'), riskAmount: new Decimal('100'), riskPercent: new Decimal('0.01') },
      { symbol: 'SOLUSDT', side: 'BUY', quantity: new Decimal('5.0'), entryPrice: new Decimal('150'), stopLossPrice: new Decimal('145'), riskAmount: new Decimal('100'), riskPercent: new Decimal('0.01') },
      { symbol: 'EURUSD', side: 'BUY', quantity: new Decimal('10000'), entryPrice: new Decimal('1.08'), stopLossPrice: new Decimal('1.075'), riskAmount: new Decimal('100'), riskPercent: new Decimal('0.01') }
    ];

    const account: any = {
      equity: new Decimal('10000'),
      balance: new Decimal('10000'),
      highWaterMark: new Decimal('10000'),
      dailyRealizedLoss: new Decimal('0'),
      openPositions,
      consecutiveLosses: 0
    };

    const check = exposure.checkExposure(account, candidate, new Decimal('0.01'));
    expect(check.passed).toBe(false);
    expect(check.reason).toContain('Maximum concurrent positions reached (3/3)');
  });
});
