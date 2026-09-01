# Phase 5B-IV Offline Provider Recovery Fixtures

## Status

`ACTIVE` by `DEC-092`. This subphase implements only deterministic `MOCK`/`REPLAY` recovery fixtures in the local core.

## Scope

- Offline state-machine fixtures for Binance snapshot buffering, bridge validation, sequence gaps, and reconnects.
- Offline cTrader depth fixtures that deliberately remain `UNPROVEN` until snapshot/rebuild semantics are evidenced.
- Fixed execution denial and zero artifact counts on every report.

## Non-goals

No adapter, dependency, SDK, network/API/WebSocket call, provider account, app registration, credential, external test, Paper/Demo, OMS, P&L, broker action, or live execution is added.

## Fail-closed behavior

For Binance, a snapshot without a buffered delta that bridges `lastUpdateId + 1` is `GAPPED`; a disconnect is `RECONNECTING`; malformed update IDs are `REJECTED`. A valid offline bridge is only `REPLAY_ONLY_VALID`, never live-feed healthy. cTrader remains `UNPROVEN` because its approved snapshot/rebuild semantics are not yet evidenced. Every status is execution-ineligible.

## Deferred work

`OPEN-007`, `OPEN-010` through `OPEN-015`, `OPEN-018`, `OPEN-022`, `OPEN-023`, and `OPEN-024` remain unresolved. Connectivity needs a separately scoped approval after provider eligibility, terms, metadata, snapshot/recovery evidence, custody controls, and an adapter review are available.
