import type { RiskDecisionPayload, StrategyCandidatePayload } from '@trade/contracts';
import { parseDecimal, toDecimalString, validatePayload, Decimal } from '@trade/contracts';
import type { AccountState, RiskCoreConfig } from './types.js';
import { DrawdownMonitor } from './drawdown-monitor.js';
import { ExposureController } from './exposure-controller.js';
import { PositionSizer } from './position-sizer.js';

export const DEFAULT_RISK_CONFIG: RiskCoreConfig = {
  baseRiskPercent: '0.0100', // 1.0% per trade
  maxRiskPercent: '0.0100',
  dailyLossLimitPercent: '0.0300', // 3.0% daily cap
  maxDrawdownLimitPercent: '0.0600', // 6.0% max drawdown breaker
  maxConcurrentPositions: 3, // DEC-015
  maxPortfolioRiskPercent: '0.0300', // 3.0% open risk cap
  consecutiveLossThreshold: 3
};

export class RiskCore {
  private drawdownMonitor: DrawdownMonitor;
  private exposureController: ExposureController;

  constructor(private readonly config: RiskCoreConfig = DEFAULT_RISK_CONFIG) {
    this.drawdownMonitor = new DrawdownMonitor(config);
    this.exposureController = new ExposureController(config);
  }

  /**
   * Authoritative deterministic evaluation of trade candidate against portfolio risk parameters.
   */
  public evaluateCandidate(
    candidate: StrategyCandidatePayload,
    account: AccountState,
    stepSize: Decimal = new Decimal('0.001'),
    minQty: Decimal = new Decimal('0.001')
  ): RiskDecisionPayload {
    const rejectionReasons: string[] = [];

    // 1. Evaluate Drawdown State & Effective Risk
    const drawdownStatus = this.drawdownMonitor.evaluate(account);
    if (drawdownStatus.blockReason) {
      rejectionReasons.push(drawdownStatus.blockReason);
    }

    const effectiveRiskPercent = drawdownStatus.effectiveRiskPercent;

    // 2. Evaluate Portfolio Exposure & Concurrency
    const exposureStatus = this.exposureController.checkExposure(account, candidate, effectiveRiskPercent);
    if (!exposureStatus.passed && exposureStatus.reason) {
      rejectionReasons.push(exposureStatus.reason);
    }

    // 3. Compute Position Size & Quantization
    const entryPrice = parseDecimal(candidate.entry_price);
    const invalidationPrice = parseDecimal(candidate.invalidation_price);

    const sizing = PositionSizer.calculatePositionSize(
      account.equity,
      effectiveRiskPercent,
      entryPrice,
      invalidationPrice,
      stepSize,
      minQty
    );

    if (!sizing.valid && sizing.reason) {
      rejectionReasons.push(sizing.reason);
    }

    const approved = rejectionReasons.length === 0 && sizing.valid && effectiveRiskPercent.gt(0);

    const payload: RiskDecisionPayload = {
      candidate_id: candidate.candidate_id,
      status: approved ? 'APPROVED' : 'REJECTED',
      approved_risk_percent: toDecimalString(approved ? effectiveRiskPercent : new Decimal(0)),
      calculated_quantity: toDecimalString(sizing.rawQuantity),
      quantized_quantity: toDecimalString(sizing.quantizedQuantity),
      estimated_risk_amount: toDecimalString(sizing.riskAmount),
      portfolio_open_risk_percent: toDecimalString(exposureStatus.portfolioOpenRiskPercent),
      concurrent_positions_count: Math.min(3, exposureStatus.concurrentPositionsCount),
      daily_loss_percent: toDecimalString(drawdownStatus.dailyLossPercent),
      drawdown_state: drawdownStatus.state,
      rejection_reasons: rejectionReasons,
      evaluated_at: new Date().toISOString()
    };

    // 4. Runtime Schema Validation (Fail-closed)
    const valRes = validatePayload('RISK_DECISION', payload);
    if (!valRes.valid) {
      throw new Error(`RiskDecision failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    return payload;
  }
}
