# Phase 5B-II Provider Due Diligence

## Status

`ACTIVE` by `DEC-088`. This is documentation-only due diligence. It creates no client, connection, credential, account link, or external request.

## Scope and safety boundary

- Research the two market families already named in `DEC-002`: cTrader Forex/metals and Binance Spot/USD-M BTC/ETH.
- Record official evidence for possible read-only sources and the information that must be verified before any future activation.
- Select no active provider and create no network capability.

The Local Trading Node remains the only future consumer of a feed. The PWA remains unable to own a market connection or credential. A data source is untrusted until it passes schema, time, sequence, freshness, reconnect, source-label, and audit controls.

## Evidence matrix

| Market family           | Technical candidate                                      | Official evidence                                                                                                                                                                                                                                                                                                                                                            | Pre-activation blockers                                                                                                                                                                                                                                | Decision in 5B-II         |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| Forex / metals          | cTrader Open API through the owner’s broker relationship | cTrader documents real-time market-data and L2 subscriptions, but application registration/approval and application/account authentication are part of the integration. [Getting started](https://help.ctrader.com/open-api/), [symbol data](https://help.ctrader.com/open-api/symbol-data/), [application registration](https://help.ctrader.com/open-api/api-application/) | Owner must verify broker/account eligibility, cTrader application approval, data entitlement, licensing/terms, exact instrument mapping, retention rights, and availability in the owner’s jurisdiction. No credential may be requested or stored yet. | `PREQUALIFIED_NOT_ACTIVE` |
| BTC / ETH Spot          | Binance official market-data streams                     | The official Spot market-stream documentation describes trade and depth updates, timestamp fields, connection lifetime, and local-order-book snapshot/reconciliation requirements. [Spot market streams](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md?plain=1)                                                                         | Owner must verify availability and terms for their jurisdiction, permitted data use/retention, exact BTC/ETH symbol mapping, snapshot/recovery semantics, and current rate/connection limits.                                                          | `PREQUALIFIED_NOT_ACTIVE` |
| BTC / ETH USD-M Futures | Binance official USD-M public market streams             | Official public-stream documentation describes book-ticker updates and identifies update/event timestamps and update IDs. [USD-M public streams](https://developers.binance.info/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/ws-streams/public)                                                                                                     | Same legal/use/availability checks as Spot, plus separate market-type mapping, contract metadata, funding/mark-price requirements, and recovery checks.                                                                                                | `PREQUALIFIED_NOT_ACTIVE` |

## Prohibited next step

No item above authorizes an adapter, WebSocket, REST call, polling, app registration, API key, OAuth/client secret, account login, external test, Paper/Demo order, OMS behavior, or execution. In particular, a public market-data endpoint is not an authorization to connect it from this product.

## Required evidence before a separately scoped connectivity phase

1. Owner confirmation of jurisdiction, provider terms, account/broker eligibility, and data-use/retention rights for each market family.
2. An approved provider-specific contract: source ID, canonical instrument mapping, timestamp semantics, sequence/checksum behavior, snapshot/reconnect protocol, rate limits, and versioned metadata authority.
3. A credential custody and revocation design for cTrader; credential material must remain outside the repository, logs, PWA, and AI context.
4. A read-only Local Trading Node adapter design with an independently auditable capability deny-list and no OMS dependency.
5. Fixture-based failure tests for stale, gapped, duplicated, reordered, malformed, unavailable, and reconnecting data before any external test is authorized.

## Acceptance criteria for this subphase

- All candidates and sources are cited from official documentation.
- No active provider is selected and no code, dependency, secret, account link, or network client is added.
- Each future activation blocker is explicit and fail-closed.
- `OPEN-007`, `OPEN-010` through `OPEN-015`, `OPEN-018`, `OPEN-022`, `OPEN-023`, and `OPEN-024` remain unresolved.
