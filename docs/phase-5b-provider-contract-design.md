# Phase 5B-III Provider-specific Read-only Contract Design

## Status

`ACTIVE` by `DEC-090`. This design is not an adapter specification that may connect to a provider. It defines the future trust boundary and its fail-closed conditions only.

## Common boundary contract

Every future inbound record must be converted by a provider-specific Local Trading Node adapter into a versioned immutable envelope before it can enter the deterministic core:

| Canonical field                                 | Required rule                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `source_id`                                     | Versioned provider + market-family identity. It is never inferred from a symbol string.                                        |
| `instrument_id` / `instrument_metadata_version` | Must resolve through an approved provider-specific mapping revision; unknown/revised mapping is rejected.                      |
| `event_id`                                      | Adapter-created UUIDv7, linked to the immutable provider-native identity or a canonical content hash. Duplicate is audit-only. |
| `timestamp_exchange` / `timestamp_local`        | Canonical RFC3339 UTC with milliseconds. Missing/invalid time is rejected; freshness is not inferred.                          |
| `stream_id`, `sequence`, `sequence_semantics`   | `sequence` is accepted only where its provider semantics are independently specified. Absence never means a gap-free stream.   |
| `payload`                                       | Strict `MarketEventPayload` schema validation, decimal strings, and source-labelled raw evidence reference.                    |
| `source_health`                                 | `UNPROVEN`, `STALE`, `GAPPED`, `RECONNECTING`, or `HEALTHY`; only a separately approved provider policy may produce `HEALTHY`. |

Any unknown field, schema version, mapping revision, timestamp meaning, sequence rule, snapshot state, or recovery state yields `UNPROVEN` and blocks new candidates. The contract is read-only: it exposes no account, user-stream, order, position, funding action, or broker-operation capability.

## cTrader contract profile — `CTRADER_SPOT_DEPTH_V1`

- Map cTrader `symbolId` only through an owner-approved metadata revision to the canonical instrument. Provider names and raw IDs are evidence, not canonical IDs.
- `ProtoOASpotEvent` can contain bid and ask independently; an event without the fields required for its declared payload is rejected. The spot timestamp must be explicitly requested and must be present for the event to be time-valid. [cTrader symbol data](https://help.ctrader.com/open-api/symbol-data/), [message reference](https://help.ctrader.com/open-api/id/messages/)
- `ProtoOADepthEvent` is an incremental state update using `newQuotes` and `deletedQuotes`. Quote `id` is a quote identity, not documented here as a total stream sequence; it must never be treated as a gap-free stream counter. [cTrader depth quote model](https://help.ctrader.com/open-api/model-messages/)
- Until an official, tested snapshot/rebuild mechanism and provider-specific freshness/reconnect policy are accepted, every cTrader depth state is `UNPROVEN` after startup, disconnect, mapping change, missing timestamp, malformed delta, or local restart.
- The cTrader profile must not carry application credentials, account identifiers, account state, or any request other than a future separately approved read-only subscription path.

## Binance Spot / USD-M contract profiles — `BINANCE_SPOT_DEPTH_V1`, `BINANCE_USDM_DEPTH_V1`

- Canonical instrument mapping is market-type specific: Spot and USD-M never share a mapping revision merely because their symbol text matches.
- Depth events retain the provider’s first/final update identifiers as decimal strings. A future adapter may call a book `HEALTHY` only after the official snapshot-plus-buffer bridging procedure is implemented and tested. It must reject gaps, stale snapshots, invalid bridge ranges, reconnects, and missing update IDs. [Binance Spot stream and local-book procedure](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md?plain=1)
- USD-M public events include update/event timestamp and update-ID fields, but they still require an independently versioned snapshot/recovery contract. [Binance USD-M public streams](https://developers.binance.info/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/ws-streams/public)
- Stream lifetime/disconnect, rate limits, and provider changelog conditions must be explicit test inputs, never assumed stable defaults.

## Capability deny-list

| Forbidden capability                                                         | Enforcement point                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| PWA connection, storage of credentials, or direct provider payload authority | Dependency direction and PWA capability deny-list         |
| Broker/account/user-data stream                                              | Provider adapter interface excludes it                    |
| `OrderIntent`, OMS, simulated fill, Paper/Demo or live action                | Deterministic-core boundary returns no execution artifact |
| AI access to source transport or raw account data                            | Role capability schema                                    |
| Automatic fallback from one provider to another                              | Explicit owner-approved source-policy revision only       |

## Required acceptance evidence before connectivity

1. Versioned symbol/metadata mapping fixtures for every enabled market.
2. Source-specific schema, timestamp conversion, sequence or quote-ID semantics, snapshot/reconnect state machine, rate-limit behavior, and failure corpus.
3. Confirmed legal availability, terms, entitlement, retention rights, and source-specific outage/status policy.
4. Credential custody/revocation proof for cTrader, without placing credential material in the repository or PWA.
5. A locally testable adapter with a hard network deny-by-default switch, zero OMS imports, and zero execution artifacts.

No connectivity work is authorized by this document.
