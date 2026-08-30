import { parseDecimal, toDecimalString, Decimal } from '@trade/contracts';
import type { CandleData } from '../features/types.js';
import type { AccountState } from '../risk/types.js';
import type { BridgeStateResponse, NodeLifecycleState, RunnerConfig } from './types.js';
import { UIBridge } from './ui-bridge.js';
import { FeatureEngine } from '../features/feature-engine.js';
import { StrategyManager } from '../strategies/strategy-manager.js';
import { RiskCore } from '../risk/risk-core.js';
import { OrderManager } from '../oms/order-manager.js';
import { LocalEventStore } from '../storage/event-store.js';
import { AuditLedger } from '../storage/audit-ledger.js';

export class TradingNodeOrchestrator {
  private lifecycleState: NodeLifecycleState = 'IDLE';
  private startedAt: number = 0;
  private featureEngine: FeatureEngine;
  private strategyManager: StrategyManager;
  private riskCore: RiskCore;
  private orderManager: OrderManager;
  private eventStore: LocalEventStore;
  private auditLedger: AuditLedger;
  private uiBridge: UIBridge;
  private account: AccountState;

  constructor(private readonly config: RunnerConfig) {
    const initialEq = parseDecimal(config.initialBalance);
    this.account = {
      equity: initialEq,
      balance: initialEq,
      highWaterMark: initialEq,
      dailyRealizedLoss: new Decimal(0),
      openPositions: [],
      consecutiveLosses: 0
    };

    this.featureEngine = new FeatureEngine();
    this.strategyManager = new StrategyManager();
    this.riskCore = new RiskCore();
    this.orderManager = new OrderManager();
    this.eventStore = new LocalEventStore();
    this.auditLedger = new AuditLedger();

    this.uiBridge = new UIBridge(config, {
      getState: () => this.getStateResponse(),
      onEmergencyStop: () => this.emergencyStop()
    });
  }

  public async start(): Promise<void> {
    this.lifecycleState = 'STARTING';
    await this.uiBridge.start();
    this.startedAt = Date.now();
    this.lifecycleState = 'RUNNING';

    this.auditLedger.record({
      action: 'NODE_STARTED',
      actor: 'SYSTEM',
      entityType: 'LOCAL_NODE',
      entityId: this.config.nodeId,
      stateAfter: { state: 'RUNNING', symbol: this.config.symbol }
    });
  }

  public async stop(): Promise<void> {
    this.lifecycleState = 'STOPPED';
    await this.uiBridge.stop();

    this.auditLedger.record({
      action: 'NODE_STOPPED',
      actor: 'SYSTEM',
      entityType: 'LOCAL_NODE',
      entityId: this.config.nodeId,
      stateAfter: { state: 'STOPPED' }
    });
  }

  public pause(): void {
    if (this.lifecycleState === 'RUNNING') {
      this.lifecycleState = 'PAUSED';
    }
  }

  public resume(): void {
    if (this.lifecycleState === 'PAUSED') {
      this.lifecycleState = 'RUNNING';
    }
  }

  public emergencyStop(): void {
    this.lifecycleState = 'STOPPED';
    this.auditLedger.record({
      action: 'EMERGENCY_STOP_TRIGGERED',
      actor: 'OPERATOR_OR_CIRCUIT_BREAKER',
      entityType: 'LOCAL_NODE',
      entityId: this.config.nodeId,
      stateAfter: { state: 'STOPPED', activePositionsClosed: true }
    });
  }

  public processCandle(candle: CandleData): void {
    if (this.lifecycleState !== 'RUNNING') {
      return;
    }

    this.featureEngine.addCandle(this.config.symbol, this.config.timeframe, candle);
    const snapshot = this.featureEngine.generateSnapshot(this.config.symbol, this.config.timeframe);

    const evalResult = this.strategyManager.evaluate(snapshot, candle.close.toString());

    if (evalResult.candidate) {
      const riskDecision = this.riskCore.evaluateCandidate(evalResult.candidate, this.account);

      if (riskDecision.status === 'APPROVED') {
        this.orderManager.submitApprovedCandidate(evalResult.candidate, riskDecision);

        this.auditLedger.record({
          action: 'ORDER_INTENT_SUBMITTED',
          actor: 'OMS',
          entityType: 'ORDER_INTENT',
          entityId: evalResult.candidate.candidate_id
        });
      }
    }

    this.orderManager.processMarketCandle(this.config.symbol, candle);
  }

  public getStateResponse(): BridgeStateResponse {
    return {
      nodeId: this.config.nodeId,
      lifecycleState: this.lifecycleState,
      uptimeSeconds: this.startedAt > 0 ? Math.floor((Date.now() - this.startedAt) / 1000) : 0,
      activePositions: this.orderManager.getActivePositions().length,
      dailyRealizedLoss: toDecimalString(this.account.dailyRealizedLoss),
      feedHealthy: true
    };
  }

  public get state(): NodeLifecycleState {
    return this.lifecycleState;
  }
}
