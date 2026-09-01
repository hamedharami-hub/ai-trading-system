# Historical Replay Admission Design Gate

## Status and scope

`ACTIVE` by `DEC-129`. This is a documentation-only gate for a future **local historical Replay dataset** admission path. It does not acquire, download, import, parse, display, or connect to data.

No `MOCK` or synthetic dataset may pass this future owner-facing admission boundary. `MOCK` remains internal test-only material.

## Required dataset identity

Before any future historical file is admitted, its immutable manifest must include:

- a dataset ID and SHA-256 of the exact source file;
- source/provider name, licence/terms reference, acquisition time, and owner confirmation that use is permitted;
- venue/market and canonical instrument mapping—not only a raw symbol string;
- timeframe/event type, exchange timezone, timestamp precision, and coverage start/end;
- schema version, units, decimal precision metadata, and all known transformations;
- a declaration that the file is historical `REPLAY`, not live data and not a performance claim.

## Admission checks

The future local admission process must reject the entire dataset when any identity field is missing, the digest differs, timestamps are non-canonical, ordering is invalid, an instrument mapping is unknown, a value has an unknown unit/precision, or provenance/licence evidence is absent.

Acceptance of a dataset must not declare it fresh, representative, globally liquid, profitable, executable, or suitable for Paper/Demo/Live use.

## Owner-facing display rule

When a future dataset passes its separately approved admission path, the PWA may display only the exact manifest label:

```text
REPLAY · historical · source-labelled · coverage-bounded · execution-ineligible
```

It must show an unavailable/rejected state rather than a chart or analysis when admission evidence is missing or invalid.

## Future evidence before implementation

1. Local file-format/schema contract and fixed decimal/timestamp semantics.
2. Valid and invalid corpus: checksum mismatch, truncated file, duplicate event, sequence gap, unknown instrument, timezone conflict, and missing licence/provenance.
3. Deterministic replay result equivalence on Windows and Android.
4. Explicit separation of historical Replay results from internal MOCK, Paper/Demo, and real-market results.
5. Owner acceptance of a separate local-import implementation scope.

## Safe stop

Until those evidence items and the implementation scope are accepted, the product imports no historical dataset and keeps the owner-facing PWA in `REPLAY unavailable` state.
