# Phase 5C-I Read-only Connectivity Readiness Manifest

## Status

`ACTIVE` by `DEC-098`. Documentation-only and fail-closed.

## Required evidence per provider profile

| Evidence                                               | cTrader                                    | Binance Spot/USD-M                                                                        |
| ------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Jurisdiction, terms, entitlement, retention            | Owner-attested and versioned               | Owner-attested and versioned                                                              |
| Canonical symbol/metadata mapping fixtures             | Required                                   | Required separately per market type                                                       |
| Timestamp and sequence/quote-ID semantics              | Required                                   | Required                                                                                  |
| Snapshot/reconnect failure corpus                      | Required; currently absent                 | Required                                                                                  |
| Credential custody/revocation proof                    | Required; no credential may enter repo/PWA | Not applicable to public-data research; any later credential use requires a separate gate |
| Local adapter review and network deny-by-default proof | Required                                   | Required                                                                                  |

## Gate

The manifest is `NOT_READY` until every required item has immutable evidence and an owner-approved provider-specific revision. `NOT_READY` means no provider activation, connection, API/WebSocket call, credential, account access, Paper/Demo, OMS, or execution.

The machine-readable baseline is [`read-only-connectivity-readiness-manifest.json`](./read-only-connectivity-readiness-manifest.json). Every evidence field begins false or null; no field may be inferred from this template.

`evaluateConnectivityReadiness` is the local Phase 5C-II companion. It lists missing evidence but is structurally limited to `NOT_READY`, `activationAllowed: false`, and `executionAllowed: false`.

## Owner attestation

The owner attested on 2026-09-01 that they are responsible for checking the legality of cTrader/OpoFinance and Binance market-data use for their residence and accounts, accept the data-use/retention terms, and authorize readiness review only. This is not technical/provider evidence and does not change `NOT_READY`.
