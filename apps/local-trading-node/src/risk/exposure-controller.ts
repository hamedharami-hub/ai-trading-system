import { Decimal } from '@trade/contracts';
import type { StrategyCandidatePayload } from '@trade/contracts';
import type { AccountState, RiskCoreConfig } from './types.js';

export interface ExposureStatus {
  passed: boolean;
  portfolioOpenRiskPercent: Decimal;
  concurrentPositionsCount: number;
  reason?: string;
}

export class ExposureController {
  constructor(private readonly config: RiskCoreConfig) {}

  public checkExposure(account: AccountState, candidate: StrategyCandidatePayload, candidateRiskPercent: Decimal): ExposureStatus {
    const concurrentPositionsCount = account.openPositions.length;
    const maxPositions = this.config.maxConcurrentPositions;
    const maxPortfolioRisk = new Decimal(this.config.maxPortfolioRiskPercent);

    // 1. Concurrent position limit check (DEC-015: max 3)
    if (concurrentPositionsCount >= maxPositions) {
      return {
        passed: false,
        portfolioOpenRiskPercent: this.calculateCurrentOpenRisk(account),
        concurrentPositionsCount,
        reason: `Maximum concurrent positions reached (${concurrentPositionsCount}/${maxPositions})`
      };
    }

    // 2. Duplicate symbol/side check
    const existingSameSide = account.openPositions.find(
      (p) => p.symbol === candidate.symbol && p.side === candidate.side
    );
    if (existingSameSide) {
      return {
        passed: false,
        portfolioOpenRiskPercent: this.calculateCurrentOpenRisk(account),
        concurrentPositionsCount,
        reason: `Position already open on ${candidate.symbol} in the same direction (${candidate.side})`
      };
    }

    // 3. Portfolio open risk limit check
    const currentOpenRisk = this.calculateCurrentOpenRisk(account);
    const newTotalRisk = currentOpenRisk.plus(candidateRiskPercent);

    if (newTotalRisk.gt(maxPortfolioRisk)) {
      return {
        passed: false,
        portfolioOpenRiskPercent: currentOpenRisk,
        concurrentPositionsCount,
        reason: `Total portfolio open risk (${newTotalRisk.times(100).toFixed(2)}%) would exceed max limit (${maxPortfolioRisk.times(100).toFixed(2)}%)`
      };
    }

    return {
      passed: true,
      portfolioOpenRiskPercent: currentOpenRisk,
      concurrentPositionsCount
    };
  }

  public calculateCurrentOpenRisk(account: AccountState): Decimal {
    let sum = new Decimal(0);
    for (const pos of account.openPositions) {
      sum = sum.plus(pos.riskPercent);
    }
    return sum;
  }
}
