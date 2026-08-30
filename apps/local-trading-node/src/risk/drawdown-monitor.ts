import { Decimal } from '@trade/contracts';
import type { AccountState, DrawdownState, RiskCoreConfig } from './types.js';

export interface DrawdownStatus {
  state: DrawdownState;
  dailyLossPercent: Decimal;
  totalDrawdownPercent: Decimal;
  effectiveRiskPercent: Decimal;
  blockReason?: string;
}

export class DrawdownMonitor {
  constructor(private readonly config: RiskCoreConfig) {}

  public evaluate(account: AccountState): DrawdownStatus {
    const baseRisk = new Decimal(this.config.baseRiskPercent);
    const dailyLimit = new Decimal(this.config.dailyLossLimitPercent);
    const maxDrawdownLimit = new Decimal(this.config.maxDrawdownLimitPercent);

    // 1. Daily Loss Percentage Calculation
    const dailyLossPercent = account.equity.gt(0)
      ? account.dailyRealizedLoss.dividedBy(account.equity)
      : new Decimal(0);

    // 2. Total Drawdown from High-Water Mark
    let totalDrawdownPercent = new Decimal(0);
    if (account.highWaterMark.gt(0) && account.equity.lt(account.highWaterMark)) {
      totalDrawdownPercent = account.highWaterMark.minus(account.equity).dividedBy(account.highWaterMark);
    }

    // 3. Circuit Breaker Checks (Fail-Closed)
    if (dailyLossPercent.gte(dailyLimit)) {
      return {
        state: 'STOPPED_NEW_ENTRIES',
        dailyLossPercent,
        totalDrawdownPercent,
        effectiveRiskPercent: new Decimal(0),
        blockReason: `Daily loss limit reached (${dailyLossPercent.times(100).toFixed(2)}% >= ${dailyLimit.times(100).toFixed(2)}%)`
      };
    }

    if (totalDrawdownPercent.gte(maxDrawdownLimit)) {
      return {
        state: 'STOPPED_NEW_ENTRIES',
        dailyLossPercent,
        totalDrawdownPercent,
        effectiveRiskPercent: new Decimal(0),
        blockReason: `Maximum drawdown circuit breaker triggered (${totalDrawdownPercent.times(100).toFixed(2)}% >= ${maxDrawdownLimit.times(100).toFixed(2)}%)`
      };
    }

    // 4. Consecutive Loss Throttle
    if (account.consecutiveLosses >= this.config.consecutiveLossThreshold) {
      return {
        state: 'HALVED_RISK',
        dailyLossPercent,
        totalDrawdownPercent,
        effectiveRiskPercent: baseRisk.dividedBy(2)
      };
    }

    return {
      state: 'NORMAL',
      dailyLossPercent,
      totalDrawdownPercent,
      effectiveRiskPercent: baseRisk
    };
  }
}
