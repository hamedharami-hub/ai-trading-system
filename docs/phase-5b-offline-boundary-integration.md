# Phase 5B-VI Offline Boundary Integration Evidence

## Status

`ACTIVE` by `DEC-096`.

## Scope

One local integration test combines invalid read-only fixture evidence, a gapped Binance recovery fixture, and the disabled provider-adapter boundary. It proves that no invalid/unrecovered data path can reach a network or execution capability.

## Non-goals

No provider connection, API/WebSocket, credential, account, Paper/Demo, OMS, order, fill, P&L, or live action.

## Acceptance evidence

The test requires `REJECTED` invalid evidence, `GAPPED` recovery, `networkAllowed: false`, `executionAllowed: false`, and zero intent/external-request counts.
