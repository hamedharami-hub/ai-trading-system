# Offline Replay Verification

## Purpose

Run local deterministic replay checks and the PWA production build together:

```powershell
pnpm verify:offline-replay
```

The command runs the existing `@trade/deterministic-core` tests, including the local `MOCK` Forex fixture for `EURUSD`, `GBPUSD`, `USDJPY`, and `XAUUSD`, replay ordering/gap validation, and existing fail-closed boundaries. It then builds the PWA.

## Interpretation

A passing result means the local fixtures and deterministic replay checks passed. It is not a real price, market-data health, strategy result, backtest performance claim, Paper/Demo fill, broker connection, or trade authorization.

Any invalid or gapped replay remains ineligible for execution and records zero intents, execution reports, simulated fills, and external requests.
