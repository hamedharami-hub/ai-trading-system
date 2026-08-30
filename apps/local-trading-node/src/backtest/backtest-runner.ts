import { parseDecimal, toDecimalString, Decimal } from '@trade/contracts';
import type { CandleData } from '../features/types.js';
import type { AccountState } from '../risk/types.js';
import type { BacktestConfig, BacktestResult, CompletedTrade } from './types.js';
import { EventReplayer } from './event-replayer.js';
import { MetricsCalculator } from './metrics-calculator.js';
import { FeatureEngine } from '../features/feature-engine.js';
import { StrategyManager } from '../strategies/strategy-manager.js';
import { RiskCore } from '../risk/risk-core.js';
import { OrderManager } from '../oms/order-manager.js';
import { MockLLMProvider } from '../ai/providers/mock-provider.js';
import { AIRouter } from '../ai/ai-router.js';

let tradeCounter = 1;

export class BacktestRunner {
  private featureEngine: FeatureEngine;
  private strategyManager: StrategyManager;
  private riskCore: RiskCore;
  private orderManager: OrderManager;
  private aiRouter: AIRouter;

  constructor(private readonly config: BacktestConfig) {
    this.featureEngine = new FeatureEngine();
    this.strategyManager = new StrategyManager();
    this.riskCore = new RiskCore();
    this.orderManager = new OrderManager();
    const mockProvider = new MockLLMProvider();
    this.aiRouter = new AIRouter({ primaryProvider: mockProvider });
  }

  public async run(candles: CandleData[]): Promise<BacktestResult> {
    const replayer = new EventReplayer(candles);
    const initialEquity = parseDecimal(this.config.initialBalance);
    let currentEquity = initialEquity;

    const account: AccountState = {
      equity: initialEquity,
      balance: initialEquity,
      highWaterMark: initialEquity,
      dailyRealizedLoss: new Decimal(0),
      openPositions: [],
      consecutiveLosses: 0
    };

    const completedTrades: CompletedTrade[] = [];
    const equityCurve: Array<{ timestamp: string; equity: string }> = [
      { timestamp: candles[0]?.closeTime || new Date().toISOString(), equity: toDecimalString(initialEquity) }
    ];

    while (replayer.hasNext()) {
      const candle = replayer.next()!;

      // 1. Add candle to Feature Engine
      this.featureEngine.addCandle(this.config.symbol, this.config.timeframe, candle);
      const snapshot = this.featureEngine.generateSnapshot(this.config.symbol, this.config.timeframe);

      // 2. Evaluate Strategies when snapshot is produced
      const evalResult = this.strategyManager.evaluate(snapshot, candle.close.toString());

      if (evalResult.candidate) {
        const candidate = evalResult.candidate;
        let aiApproved = true;
        if (this.config.enableAIValidation) {
          const aiRes = await this.aiRouter.runEvaluationPipeline(candidate, snapshot);
          aiApproved = aiRes.success;
        }

        if (aiApproved) {
          const riskDecision = this.riskCore.evaluateCandidate(candidate, account);

          if (riskDecision.status === 'APPROVED') {
            this.orderManager.submitApprovedCandidate(candidate, riskDecision);
          }
        }
      }

      // 3. Process Market Candle in Order Manager
      this.orderManager.processMarketCandle(this.config.symbol, candle);
    }

    const metrics = MetricsCalculator.calculate(completedTrades, initialEquity);

    return {
      config: this.config,
      metrics,
      trades: completedTrades,
      finalEquity: currentEquity,
      equityCurve
    };
  }
}
