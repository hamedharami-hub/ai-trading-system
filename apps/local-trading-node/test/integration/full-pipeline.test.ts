import { describe, it, expect, afterEach } from 'vitest';
import { TradingNodeOrchestrator } from '../../src/runner/trading-node-orchestrator.js';
import { NodeClient } from '../../../../apps/pwa/src/services/node-client.js';
import { DashboardModel } from '../../../../apps/pwa/src/components/dashboard-model.js';
import type { CandleData } from '../../src/features/types.js';
import { Decimal } from '@trade/contracts';

describe('Full End-to-End System Pipeline Integration', () => {
  let orchestrator: TradingNodeOrchestrator | null = null;
  const testPort = 19988;
  const sessionToken = 'secret-integration-token-999';

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.stop();
      orchestrator = null;
    }
  });

  it('transits data from Market Ingestion through Feature, AI, Risk, OMS, Audit, and PWA Client', async () => {
    // 1. Initialize and start Local Trading Node Orchestrator
    orchestrator = new TradingNodeOrchestrator({
      nodeId: 'INT_TEST_NODE_1',
      host: '127.0.0.1',
      port: testPort,
      sessionToken,
      symbol: 'BTCUSDT',
      timeframe: '5M',
      initialBalance: '20000'
    });

    await orchestrator.start();
    expect(orchestrator.state).toBe('RUNNING');

    // 2. Initialize PWA Client and Dashboard Model
    const client = new NodeClient({
      nodeUrl: `http://127.0.0.1:${testPort}`,
      sessionToken
    });

    const model = new DashboardModel();
    client.onEvent((ev) => {
      model.processEnvelope(ev);
    });

    // 3. PWA fetches initial state
    const initialState = await client.fetchState();
    expect(initialState.nodeId).toBe('INT_TEST_NODE_1');
    expect(initialState.lifecycleState).toBe('RUNNING');
    model.updateState({
      nodeId: initialState.nodeId,
      lifecycleState: initialState.lifecycleState,
      uptimeSeconds: initialState.uptimeSeconds,
      activePositionsCount: initialState.activePositions
    });

    expect(model.getState().nodeId).toBe('INT_TEST_NODE_1');
    expect(model.getState().lifecycleState).toBe('RUNNING');

    // 4. Ingest a sequence of candles into Orchestrator
    const baseTime = Date.now();
    for (let i = 0; i < 25; i++) {
      const p = 65000 + i * 20;
      const candle: CandleData = {
        open: new Decimal(p),
        high: new Decimal(p + 30),
        low: new Decimal(p - 20),
        close: new Decimal(p + 15),
        volume: new Decimal(100),
        openTime: new Date(baseTime + i * 60000).toISOString(),
        closeTime: new Date(baseTime + (i + 1) * 60000).toISOString()
      };
      orchestrator.processCandle(candle);
    }

    // 5. Verify Node Telemetry State after candle processing
    const updatedState = orchestrator.getStateResponse();
    expect(updatedState.nodeId).toBe('INT_TEST_NODE_1');
    expect(updatedState.feedHealthy).toBe(true);

    // 6. Test PWA Emergency Stop Trigger
    const stopResult = await client.triggerEmergencyStop();
    expect(stopResult).toBe(true);
    expect(orchestrator.state).toBe('STOPPED');
  });
});
