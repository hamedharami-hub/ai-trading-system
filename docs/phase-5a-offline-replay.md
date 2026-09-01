# Phase 5A Offline Replay Boundary

## Status

`LOCKED` by `DEC-084`. This is the first bounded part of Consolidated Phase 5 and supplies offline evidence only.

## In scope

- Deterministic replay of committed Mock/Replay fixtures.
- Sequence, duplicate, and ordering validation.
- Immutable in-memory replay reports with explicit accepted and rejected evidence.
- Local unit tests and reproducibility checks.

## Explicit non-goals

- No network, market-data feed, broker/exchange adapter, credential, account, or cloud call.
- No `OrderIntent`, OMS state transition, simulated fill, Paper/Demo behavior, or live execution.
- No P&L, expectancy, win-rate, fee, slippage, or profitability claim while `OPEN-014` remains operationally uncalibrated.
- No feature/strategy implementation beyond the already fail-closed boundaries.

## Fail-closed behavior

An invalid replay produces an `INVALID` report with rejection evidence. It cannot be promoted into a candidate, risk decision, order, fill, or performance claim. The report has fixed zero counts for intents, execution reports, external requests, and simulated fills.

## Blocked follow-on work

`OPEN-007`, `OPEN-010` through `OPEN-015`, `OPEN-018`, `OPEN-022`, `OPEN-023`, and `OPEN-024` remain relevant to any later read-only feed, costed backtest, OMS simulation, Paper/Demo, or cross-device performance claim. They are not implicitly resolved by this offline runner.
