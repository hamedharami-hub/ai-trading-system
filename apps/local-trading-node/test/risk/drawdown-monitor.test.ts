import { describe, it, expect } from 'vitest';
import { DrawdownMonitor } from '../../src/risk/drawdown-monitor.js';
import { DEFAULT_RISK_CONFIG } from '../../src/risk/risk-core.js';
import type { AccountState } from '../../src/risk/types.js';
import { Decimal } from '@trade/contracts';

describe('Drawdown Monitor & Circuit Breakers', () => {
  const baseAccount: AccountState = {
    equity: new Decimal('10000'),
    balance: new Decimal('10000'),
    highWaterMark: new Decimal('10000'),
    dailyRealizedLoss: new Decimal('0'),
    openPositions: [],
    consecutiveLosses: 0
  };

  it('evaluates NORMAL state under baseline conditions', () => {
    const monitor = new DrawdownMonitor(DEFAULT_RISK_CONFIG);
    const status = monitor.evaluate(baseAccount);

    expect(status.state).toBe('NORMAL');
    expect(status.effectiveRiskPercent.toString()).toBe('0.01');
    expect(status.blockReason).toBeUndefined();
  });

  it('transitions to HALVED_RISK on 3 consecutive losses', () => {
    const monitor = new DrawdownMonitor(DEFAULT_RISK_CONFIG);
    const account = { ...baseAccount, consecutiveLosses: 3 };
    const status = monitor.evaluate(account);

    expect(status.state).toBe('HALVED_RISK');
    expect(status.effectiveRiskPercent.toString()).toBe('0.005');
  });

  it('transitions to STOPPED_NEW_ENTRIES when daily loss limit is reached', () => {
    const monitor = new DrawdownMonitor(DEFAULT_RISK_CONFIG);
    const account = { ...baseAccount, dailyRealizedLoss: new Decimal('350') }; // 3.5% > 3.0% limit
    const status = monitor.evaluate(account);

    expect(status.state).toBe('STOPPED_NEW_ENTRIES');
    expect(status.effectiveRiskPercent.toString()).toBe('0');
    expect(status.blockReason).toContain('Daily loss limit reached');
  });
});
