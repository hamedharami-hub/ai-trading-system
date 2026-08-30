# Approved Risk Rules

## 1. Scope

This document consolidates only risk rules already locked by the Persian PDF and decision register. It is not executable policy, a calculation specification, or permission to trade. `BLOCKED` means the limit is approved but cannot be implemented safely until the listed owner decisions are resolved.

## 2. Portfolio and trade limits

| ID | Approved rule | Status | Source | Blockers / prohibited inference |
| --- | --- | --- | --- | --- |
| RISK-001 | Per-trade risk is adaptive within 0.25%-0.75%. | BLOCKED | PDF §8.1; DEC-019 | OPEN-004. Do not infer the mapping from grade, volatility, market, or confidence. |
| RISK-002 | Total open risk across the shared cTrader/Binance portfolio is capped at 1%. | BLOCKED | PDF §8.1; DEC-019 | OPEN-004-OPEN-006. Equity, conversion, correlation, and unrealized-risk definitions remain open. |
| RISK-003 | No more than three positions may be open concurrently, while still respecting the 1% cap. | LOCKED limit | PDF §8.1; DEC-019 | Does not imply three positions are always permitted. Correlation may require fewer. |
| RISK-004 | Default daily loss limit is 1.5%. | BLOCKED | PDF §8.1; DEC-020 | OPEN-005, OPEN-011. Loss basis, reset boundary, and account aggregation remain open. |
| RISK-005 | At 3% drawdown, risk is halved. | BLOCKED | PDF §8.1; DEC-020 | OPEN-005. High-water mark, equity basis, and recovery transition remain open. |
| RISK-006 | At 5% drawdown, new entries stop pending review. | BLOCKED | PDF §8.1; DEC-020 | OPEN-005. Existing-position management and resumption criteria remain open. |
| RISK-007 | If a daily stop has activated, increasing the limit that day does not restart entries; the new value applies no earlier than the next day. | BLOCKED | PDF §8.1; DEC-020 | OPEN-005, OPEN-011. “Day” and authorization workflow remain open. |
| RISK-008 | Net R:R is dynamic but may never be below 1.5 after costs. | BLOCKED | PDF §5.2, §8.1; DEC-015 | OPEN-014. Commission, spread, funding, slippage, latency, and partial-fill models remain open. |

## 3. Direction, lifecycle, and policy limits

| ID | Approved rule | Status | Source | Blockers / prohibited inference |
| --- | --- | --- | --- | --- |
| RISK-009 | Counter-trend is Manual Confirm only, A+ only, fixed at 0.25% risk, and forbidden in Auto. | BLOCKED | PDF §2.2, §8.1; DEC-013 | OPEN-001, OPEN-002. A+ and trend-direction definitions remain open. |
| RISK-014 | High-impact relevant news blocks new entries 30 minutes before and 15 minutes after the event. | BLOCKED | PDF §4.4; DEC-023 | OPEN-012. Provider, relevance mapping, revisions, and impact taxonomy remain open. |
| RISK-015 | A stale or unavailable calendar blocks affected assets only. | BLOCKED | PDF §4.4; DEC-023 | OPEN-012. Affected-asset mapping and stale threshold remain open. |
| RISK-016 | Price, spread, slippage, account state, position state, and risk are revalidated immediately before any future send; user changes to size or risk pass all gates again. | BLOCKED | PDF §3.2, §7.2, §8.2; DEC-018, DEC-021 | OPEN-006, OPEN-013, OPEN-014, OPEN-016, OPEN-017. No implementation default is approved. |
| RISK-017 | A pending entry is cancelled on setup invalidation or after at most three entry-timeframe candles; price is not chased after a missed fill. | BLOCKED | PDF §7.2; DEC-018 | OPEN-013. Candle ownership, partial fill, repricing, and cancellation races remain open. |

## 4. Binance Futures limits

| ID | Approved rule | Status | Source | Blockers / prohibited inference |
| --- | --- | --- | --- | --- |
| RISK-010 | Futures use isolated margin only. | LOCKED limit | PDF §8.3; DEC-022 | Exact venue/account behavior remains future adapter work. |
| RISK-011 | Futures leverage is adaptive from 1x to 3x. | BLOCKED | PDF §8.3; DEC-022 | OPEN-004, OPEN-006. Do not infer the leverage mapping. |
| RISK-012 | Simultaneous long and short positions on one symbol are prohibited in v1. | BLOCKED | PDF §8.3; DEC-022 | OPEN-010. Canonical symbol identity and reconciliation remain open. |
| RISK-013 | Any future Auto trial is A+ only, limited to one session, and uses 0.25% risk for the first 100 trades before review. | BLOCKED | PDF §1.2, §8.3; DEC-022 | OPEN-001, OPEN-002, OPEN-011, OPEN-023. Auto is not approved for implementation. |

## 5. Protective handling and live gates

| ID | Approved rule | Status | Source | Blockers / prohibited inference |
| --- | --- | --- | --- | --- |
| RISK-018 | Future protective SL/TP, idempotent OMS, reconciliation, restart recovery, and failover are mandatory safety goals. | BLOCKED | PDF §1.3, §8.4, §13; DEC-031 | OPEN-008, OPEN-009, OPEN-015. Exact order semantics and exit policy are not approved. |
| RISK-019 | Live eligibility requires at least four consecutive paper/demo weeks, 500 valid signals overall, adequate per-market/path samples, positive post-cost expectancy, and passed execution/data/security gates. | BLOCKED | PDF §13; DEC-033 | OPEN-014, OPEN-023. Statistical interpretation and path counts remain open. |
| RISK-020 | Live activation is independently approved by the owner for each market and strategy; passing one does not authorize another. | LOCKED gate | PDF §13; DEC-004, DEC-033 | No current live approval exists. |

## 6. Approved sizing concept, unresolved specification

The PDF approves this conceptual relationship only:

```text
risk_amount = portfolio_equity_AUD * risk_percent
unit_risk = abs(entry - stop) * contract_value * fx_conversion
raw_size = risk_amount / unit_risk
final_size = floor_to_step(raw_size), subject to margin, min_notional,
             correlation_budget, spread, slippage, and open-risk cap
```

This is not implementation-ready. DEC-038 requires decimal strings at wire boundaries, prohibits JavaScript `number` for authoritative financial calculations, and obtains symbol precision from versioned metadata. DEC-040 selects arbitrary-precision Decimal for internal calculations. `OPEN-004`, `OPEN-005`, and `OPEN-006` still block the Decimal package/runtime, metadata authority/change behavior, data sources, rounding order, account aggregation, currency conversion, margin, and correlation behavior.

DEC-041 fixes initial quantity rounding: round down to the permitted `stepSize` so ordinary quantization cannot increase risk. DEC-042 permits an exception only when the result is below `minQty` or `minNotional`: raise only to the minimum venue-valid quantity, then rerun every policy, risk, margin, correlation, and venue gate. It does not decide rounding for prices, fees, FX conversion, risk amounts, or the remaining ordering/formula inputs of venue constraints.

## 7. Explicitly unapproved

No live activation, connector, execution behavior, emergency flatten, or Auto mode is approved. The following planning decisions supersede the historical unresolved wording above.

## 8. Delegated-resolution overlay

DEC-044, DEC-049, DEC-050, DEC-056, DEC-057, DEC-058, and DEC-066 lock the following future deterministic baseline:

- A risk is 0.25%; A+ is 0.50%; A+ ممتاز is 0.75% only under every stricter condition in [phase-1-delegated-decisions-fa.md](phase-1-delegated-decisions-fa.md). Total open risk remains 1%, maximum concurrent positions remains three, and each correlation group is capped at 0.50%.
- Portfolio equity is AUD mark-to-market across active accounts; stale active-account data blocks new portfolio entries. FX older than 30 seconds blocks dependent entries. Quantity rounds down; only the pre-approved minimum-order exception may increase it, followed by full revalidation.
- Sydney midnight is the daily boundary. Daily loss includes realized/unrealized PnL, commission and funding; the adjusted high-water mark treats deposits/withdrawals neutrally. At 3% drawdown risk halves; at 5% new entries stop pending manual owner approval. No forced flatten is inferred.
- Pending candidates expire after the delegated lifecycle rules; fixed SL/TP is the sole future v1 exit method. Partial exits, trailing, break-even and price chasing are prohibited without a later decision.
- Cost, statistical-gate, and live requirements use the conservative definitions in the delegated profile. Passing an eventual test still never enables live trading without a later explicit approval per market and strategy.

These rules are design constraints for their designated later phases, not instructions to implement or connect to any venue now.
