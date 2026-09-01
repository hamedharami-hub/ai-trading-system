# Offline AI Verification

## Purpose

Run the existing local AI safety tests and production PWA build together:

```powershell
pnpm verify:offline-ai
```

This command runs only:

1. `@trade/offline-ai` Vitest checks for artifact verification, bounded local-runtime parsing, schema validation, evidence allowlisting, bounded `REANALYZE`, and report-only Auditor behavior.
2. The static production build for `@trade/pwa`.

## What a passing result means

A passing result is evidence that the checked local code paths and PWA build completed successfully. It is **not** evidence of model quality, real market-data health, a trading signal, profitability, Paper/Demo behavior, or execution readiness.

## Safety boundary

The command must not load or download a model, call remote AI, contact a market-data provider, access an account, or create an order. Any failure is fail-closed: treat the corresponding result as unavailable and take no new trading action.
