import { TradingNodeOrchestrator } from './runner/trading-node-orchestrator.js';

async function main() {
  const host = process.env.NODE_HOST || '127.0.0.1';
  const port = parseInt(process.env.NODE_PORT || '8765', 10);
  const sessionToken = process.env.SESSION_TOKEN || 'local-secure-token-2026';
  const symbol = (process.env.SYMBOL || 'BTCUSDT') as any;
  const timeframe = (process.env.TIMEFRAME || '5M') as any;
  const initialBalance = process.env.INITIAL_BALANCE || '10000';

  console.log('========================================================');
  console.log('  Autonomous AI Trading System - Local Node Daemon');
  console.log('========================================================');
  console.log(`  Host:            http://${host}:${port}`);
  console.log(`  Session Token:   ${sessionToken}`);
  console.log(`  Symbol:          ${symbol} (${timeframe})`);
  console.log(`  Initial Balance: ${initialBalance} USDT`);
  console.log(`  Execution Mode:  DETERMINISTIC PAPER SIMULATION ONLY`);
  console.log('========================================================');

  const orchestrator = new TradingNodeOrchestrator({
    nodeId: 'LOCAL_WIN_NODE_01',
    host,
    port,
    sessionToken,
    symbol,
    timeframe,
    initialBalance
  });

  await orchestrator.start();
  console.log(`[DAEMON] Local Trading Node is RUNNING on http://${host}:${port}`);
  console.log(`[DAEMON] UI Bridge SSE endpoint: http://${host}:${port}/events`);
  console.log(`[DAEMON] Press Ctrl+C to stop node gracefully.`);

  process.on('SIGINT', async () => {
    console.log('\n[DAEMON] Gracefully stopping Trading Node...');
    await orchestrator.stop();
    console.log('[DAEMON] Stopped successfully.');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[DAEMON] Failed to start Trading Node:', err);
  process.exit(1);
});
