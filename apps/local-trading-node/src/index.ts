import { toDecimalString, parseDecimal } from '@trade/contracts';

export * from './feed/types.js';
export * from './feed/clock-sync.js';
export * from './feed/sequence-tracker.js';
export * from './feed/reconnect-handler.js';
export * from './feed/normalizers/binance-normalizer.js';
export * from './feed/normalizers/ctrader-normalizer.js';
export * from './feed/feed-manager.js';

export * from './features/types.js';
export * from './features/smc-engine.js';
export * from './features/order-flow-engine.js';
export * from './features/secondary-filters.js';
export * from './features/feature-engine.js';

export * from './strategies/types.js';
export * from './strategies/grading.js';
export * from './strategies/scalp-engine.js';
export * from './strategies/intraday-engine.js';
export * from './strategies/strategy-manager.js';

export * from './ai/types.js';
export * from './ai/providers/provider-interface.js';
export * from './ai/providers/mock-provider.js';
export * from './ai/prompts/prompt-templates.js';
export * from './ai/roles/analyst-role.js';
export * from './ai/roles/critic-role.js';
export * from './ai/roles/judge-role.js';
export * from './ai/ai-router.js';
export * from './ai/human-layer.js';

export * from './risk/types.js';
export * from './risk/position-sizer.js';
export * from './risk/drawdown-monitor.js';
export * from './risk/exposure-controller.js';
export * from './risk/risk-core.js';

export * from './oms/types.js';
export * from './oms/order-state-machine.js';
export * from './oms/bracket-manager.js';
export * from './oms/simulation-connector.js';
export * from './oms/order-manager.js';

export * from './backtest/types.js';
export * from './backtest/metrics-calculator.js';
export * from './backtest/event-replayer.js';
export * from './backtest/backtest-runner.js';

export * from './storage/types.js';
export * from './storage/event-store.js';
export * from './storage/audit-ledger.js';
export * from './storage/report-generator.js';

export * from './runner/types.js';
export * from './runner/ui-bridge.js';
export * from './runner/trading-node-orchestrator.js';

export function getNodeStatus(): string {
  const dec = parseDecimal('100.00');
  return `Local Trading Node initialized. Initial balance baseline: ${toDecimalString(dec)}`;
}
