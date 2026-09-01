# Local Paper Trading Design Gate

## Status and scope

`ACTIVE` by `DEC-124`. This is a documentation-only design gate for a future local, fully offline Paper Trading simulator. It creates no simulator or OMS behavior and does not use a price, market feed, account, credential, broker, network request, or execution path.

The future simulator must never be described as Demo, Testnet, or Live. An internal simulated fill is not evidence of broker behavior or profitability.

## Non-negotiable authority boundary

The PWA remains presentation-only. A future deterministic Local Trading Node owns all policy, risk, intent, lifecycle, and audit decisions. AI output and browser interaction are non-authoritative. Unknown, invalid, stale, conflicting, or timed-out state produces no new simulated trade.

## Future design boundary

Only after a separate implementation gate, a simulated lifecycle may model the already locked conceptual sequence from `DEC-051`:

```text
DRAFT -> POLICY_ALLOWED -> RISK_APPROVED -> INTENT_CREATED
-> simulated lifecycle outcome -> RECONCILED
```

This diagram is not an implementation authorization. In particular, it must not imply that a paper fill is automatically generated, that any risk decision is valid, or that a simulated event can be reused as an external order.

## Required fail-closed controls before implementation

1. Every simulated record must be immutable, linked to its fixture/evidence identifiers, and visibly labelled `PAPER_LOCAL_ONLY`.
2. A valid input must still create zero records unless deterministic PolicyGate and RiskDecision inputs are valid and explicitly within a later approved scope.
3. All unknown lifecycle states, duplicate intent IDs, invalid sequence, missing cost input, unavailable protective-order model, and failed reconciliation must stop new simulated entries.
4. No simulated fill may be treated as a real price, broker acknowledgement, Demo/Testnet result, trading signal, or profitability evidence.
5. Costs and partial-fill assumptions must be recorded per run. Missing assumptions produce `NO_TRADE` rather than a synthetic outcome.

## Existing decisions this future work must obey

- `DEC-032`: replay, paper, and later execution must reuse the same deterministic logic; Paper and Demo/Testnet results are always separate.
- `DEC-051`: lifecycle, idempotency, recovery, protective handling, and reconciliation rules are deterministic requirements; a terminal result requires reconciliation.
- `DEC-056`: expiry, reanalysis, order selection, invalidation, and no-chase constraints apply.
- `DEC-057`: cost and partial-fill assumptions are mandatory; a paper result cannot become a profitability claim.
- `DEC-058`: no default exit policy may be invented.

## Evidence required for a future implementation gate

- immutable schema and contract review for local simulated records;
- deterministic replay fixtures for accepted, rejected, expired, duplicate, partial, cancelled, and unknown paths;
- property tests demonstrating no duplicate intent and no simulated trade after invalid data or a gate failure;
- cost/partial-fill assumption corpus with zero-claim reporting;
- audit reconstruction test proving every simulated record is traceable to fixture evidence;
- explicit owner acceptance of the implementation scope.

## Safe stop

Until every future implementation-gate item is accepted, this document is the only Paper Trading artifact. The product shows no Paper Trading control and creates no simulated order, fill, P&L, position, or execution report.
