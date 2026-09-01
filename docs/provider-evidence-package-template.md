# Read-only Provider Evidence Package Template

## Purpose

Complete one immutable package per provider profile before any separately approved connectivity phase. A missing item means `NOT_READY`.

## Required package contents

1. Provider name, market family, terms/version URL, jurisdiction/availability statement, and data-use/retention right.
2. Immutable source revision for exact symbols, contract metadata, precision, timestamp semantics, and market type.
3. A mapping fixture from provider-native IDs to canonical `instrument_id` plus versioned metadata revision.
4. Documented sequence or quote-ID semantics. If no total sequence exists, record that fact and the recovery limitation.
5. Snapshot, buffer, gap, reconnect, rate-limit, outage, and changelog behavior with a locally replayable failure corpus.
6. cTrader only: credential custody, revocation, rotation, and account-scope proof. Do not include any credential itself.
7. Local Node adapter design review proving network deny-by-default, no PWA transport, no AI transport, no account/user stream, no OMS imports, and zero execution artifacts.
8. Owner approval of the package revision and a separately scoped authorization before any external connectivity test.

## Explicit exclusion

This template does not authorize an account login, application registration, credential, provider request, connection, Paper/Demo, OMS action, or execution.
