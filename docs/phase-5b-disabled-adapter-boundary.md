# Phase 5B-V Disabled Read-only Adapter Boundary

## Status

`ACTIVE` by `DEC-094`. The local core adds a type-only provider boundary that is disabled by construction.

## In scope

- A provider-profile capability report for the prequalified cTrader and Binance profiles.
- A disabled boundary whose public interface deliberately has no transport, credential, account, OMS, or execution operation.
- Local tests proving the deny-list and the absence of connection/order methods.

## Non-goals

No provider adapter, dependency, SDK, network/API/WebSocket client, endpoint, credential, app registration, account access, external test, Paper/Demo, OMS, broker action, or execution is added.

## Fail-closed contract

Every profile reports `DISABLED`, all capability flags are `false`, and `permittedOperations` is permanently empty. The boundary cannot connect, subscribe, poll, authenticate, read account state, emit an `OrderIntent`, or submit an order because those methods do not exist on its public interface.

## Deferred work

Only a separately scoped phase with provider eligibility, terms, metadata, recovery evidence, custody design, and explicit owner authorization may introduce a real Local Trading Node adapter. It must not replace this disabled boundary silently.
