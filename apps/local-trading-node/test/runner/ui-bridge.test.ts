import { describe, it, expect, afterEach } from 'vitest';
import { UIBridge } from '../../src/runner/ui-bridge.js';
import type { RunnerConfig } from '../../src/runner/types.js';
import * as http from 'node:http';

describe('UI Bridge Server', () => {
  let bridge: UIBridge | null = null;
  const testPort = 19876;
  const config: RunnerConfig = {
    nodeId: 'TEST_NODE_1',
    host: '127.0.0.1',
    port: testPort,
    sessionToken: 'test-secret-token-1234',
    symbol: 'BTCUSDT',
    timeframe: '5M',
    initialBalance: '10000'
  };

  afterEach(async () => {
    if (bridge) {
      await bridge.stop();
      bridge = null;
    }
  });

  it('starts HTTP server and handles health, state, and unauthorized requests', async () => {
    let emergencyStopped = false;

    bridge = new UIBridge(config, {
      getState: () => ({
        nodeId: config.nodeId,
        lifecycleState: 'RUNNING',
        uptimeSeconds: 42,
        activePositions: 0,
        dailyRealizedLoss: '0.00',
        feedHealthy: true
      }),
      onEmergencyStop: () => {
        emergencyStopped = true;
      }
    });

    await bridge.start();

    // 1. GET /health
    const healthRes = await fetch(`http://127.0.0.1:${testPort}/health`);
    expect(healthRes.status).toBe(200);
    const healthJson = await healthRes.json() as any;
    expect(healthJson.status).toBe('ok');
    expect(healthJson.nodeId).toBe('TEST_NODE_1');

    // 2. GET /state
    const stateRes = await fetch(`http://127.0.0.1:${testPort}/state`);
    expect(stateRes.status).toBe(200);
    const stateJson = await stateRes.json() as any;
    expect(stateJson.lifecycleState).toBe('RUNNING');
    expect(stateJson.uptimeSeconds).toBe(42);

    // 3. POST /emergency-stop without auth -> 401 Unauthorized
    const unauthRes = await fetch(`http://127.0.0.1:${testPort}/emergency-stop`, { method: 'POST' });
    expect(unauthRes.status).toBe(401);
    expect(emergencyStopped).toBe(false);

    // 4. POST /emergency-stop with valid Bearer token -> 200 OK
    const authRes = await fetch(`http://127.0.0.1:${testPort}/emergency-stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.sessionToken}` }
    });
    expect(authRes.status).toBe(200);
    expect(emergencyStopped).toBe(true);
  });
});
