import { describe, it, expect } from 'vitest';
import { CandidateGrader } from '../../src/strategies/grading.js';
import type { FeatureSnapshotPayload } from '@trade/contracts';

function makeSnapshot(overrides: Partial<FeatureSnapshotPayload> = {}): FeatureSnapshotPayload {
  return {
    symbol: 'EURUSD',
    timeframe: '5M',
    smc: {
      bos: true,
      choch: false,
      displacement: true,
      fvg: {
        top: '1.08500',
        bottom: '1.08400',
        type: 'BULLISH',
        mitigated: false
      },
      ...overrides.smc
    },
    order_flow: {
      ofi: '5',
      cvd: '150',
      spread_state: 'NORMAL',
      ...overrides.order_flow
    },
    secondary_filters: {
      atr: '0.00080',
      vwap: '1.08300',
      volume_profile_poc: '1.08350',
      ...overrides.secondary_filters
    },
    evidence_candle_time: new Date().toISOString(),
    ...overrides
  };
}

describe('Candidate Grader', () => {
  it('assigns GRADE_A for high confluence (SMC + Order Flow + high R:R)', () => {
    const snapshot = makeSnapshot();
    const result = CandidateGrader.grade({
      side: 'BUY',
      calculatedRR: '2.50',
      minRR: '1.50',
      featureSnapshot: snapshot
    });

    expect(result.grade === 'A' || result.grade === 'A_PLUS').toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('rejects candidate if calculated R:R is below required minimum', () => {
    const snapshot = makeSnapshot();
    const result = CandidateGrader.grade({
      side: 'BUY',
      calculatedRR: '1.20',
      minRR: '1.50',
      featureSnapshot: snapshot
    });

    expect(result.grade).toBe('REJECTED');
    expect(result.reason).toContain('below minimum');
  });

  it('rejects candidate if market spread is WIDE', () => {
    const snapshot = makeSnapshot({
      order_flow: { ofi: '0', cvd: '0', spread_state: 'WIDE' }
    });

    const result = CandidateGrader.grade({
      side: 'BUY',
      calculatedRR: '2.00',
      minRR: '1.50',
      featureSnapshot: snapshot
    });

    expect(result.grade).toBe('REJECTED');
    expect(result.reason).toContain('spread is WIDE');
  });
});
