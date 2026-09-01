# Phase 5B-I Read-only Market-data Fixture Boundary

## Status

`ACTIVE` by `DEC-086`. This is a narrow, local-first subphase of Consolidated Phase 5B.

## In scope

- A deterministic contract for committed `MOCK` and `REPLAY` market-data fixtures only.
- Validation of non-empty fixtures, canonical UTC-millisecond exchange/local timestamps, event identity, sequence ordering, gaps, and duplicates.
- Immutable local reports and unit tests.

## Explicit non-goals

- No provider selection, API, network client, WebSocket, polling, credential, account, or external market-data call.
- No freshness threshold, clock-drift measurement, reconnect policy, checksum validation, or market-health assertion for a real provider.
- No `OrderIntent`, OMS transition, simulated fill, Paper/Demo mode, P&L, profitability claim, broker action, or live execution.

## Fail-closed behavior

Missing or non-canonical timestamps, an empty fixture, duplicate event ID, invalid sequence, sequence gap, or out-of-order sequence returns `REJECTED`. A structurally valid fixture returns `REPLAY_ONLY_VALID`, not live-feed healthy. Every report permanently carries `freshnessEvaluated: false`, `requiresFreshnessPolicy: true`, `executionEligible: false`, and zero counts for intents, executions, fills, and external requests.

## Deferred decisions and evidence

`DEC-046` defines the future safety profile, but an external adapter needs separate provider/licensing/availability evidence and a separately approved 5B-II scope before its freshness, drift, reconnect, checksum, and source-specific behavior can be implemented. `OPEN-007`, `OPEN-010` through `OPEN-015`, `OPEN-018`, `OPEN-022`, `OPEN-023`, and `OPEN-024` remain unresolved for later work and are not resolved here.
