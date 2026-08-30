import { describe, it, expect, afterEach } from 'vitest';
import { TradingNodeOrchestrator } from '../../src/runner/trading-node-orchestrator.js';
import type { RunnerConfig } from '../../src/runner/types.js';
import type { CandleData } from '../../src/features/types.js';
import { Decimal } from '@trade/contracts';

describe('Trading Node Orchestrator', () => {
  let orchestrator: TradingNodeOrchestrator | null = null;
  const testPort = 19877;
  const config: RunnerConfig = {
    nodeId: 'ORCH_NODE_1',
    host: '127.0.0.1',
    port: testPort,
    sessionToken: 'orch-secret-token',
    symbol: 'BTCUSDT',
    timeframe: '5M',
    initialBalance: '10000'
  };

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.stop();
      orchestrator = null;
    }
  });

  it('manages node lifecycle transitions and processes candles', async () => {
    orchestrator = new TradingNodeOrchestrator(config);
    expect(orchestrator.state).toBe('IDLE');

    await orchestrator.start();
    expect(orchestrator.state).toBe('RUNNING');

    orchestrator.pause();
    expect(orchestrator.state).toBe('PAUSED');

    orchestrator.resume();
    expect(orchestrator.state).toBe('RUNNING');

    // Process a synthetic candle
    const candle: CandleData = {
      open: new Decimal('65000'),
      high: new Decimal('65100'),
      low: new Decimal('64900'),
      close: new Decimal('65050'),
      volume: new Decimal('100'),
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString()
    };

    orchestrator.processCandle(candle);

    const state = orchestrator.getStateResponse();
    expect(state.nodeId).toBe('ORCH_NODE_1');
    expect(state.lifecycleState).toBe('RUNNING');

    orchestrator.emergencyStop();
    expect(orchestrator.state).toBe('STOPPED');
  });
});
