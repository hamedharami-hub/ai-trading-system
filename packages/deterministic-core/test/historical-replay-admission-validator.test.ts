import { describe, expect, it } from "vitest";
import { validateHistoricalReplayCsv } from "../src/replay/historical-replay-admission-validator.js";

const SHA256 = "a".repeat(64);
const VALID_CSV = [
  "Etc/UTC,Open,High,Low,Close,Volume",
  "2025-08-01T00:00:00+00:00,1.14217,1.14217,1.14192,1.14194,101130000",
  "2025-08-01T00:01:00+00:00,1.14193,1.14193,1.14153,1.14161,78360000",
].join("\n");

describe("historical replay admission", () => {
  it("admits an internally consistent UTC M1 OHLCV CSV as Replay only", () => {
    expect(
      validateHistoricalReplayCsv({
        datasetId: "eurusd-m1-sample",
        expectedSha256: SHA256,
        actualSha256: SHA256.toUpperCase(),
        csvText: VALID_CSV,
      }),
    ).toEqual({
      datasetId: "eurusd-m1-sample",
      status: "ADMITTED_LOCAL_REPLAY",
      dataRowCount: 2,
      coverageStartUtc: "2025-08-01T00:00:00+00:00",
      coverageEndUtc: "2025-08-01T00:01:00+00:00",
      rejectionReasons: [],
      sourceKind: "REPLAY",
      executionEligible: false,
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed on a checksum mismatch", () => {
    const report = validateHistoricalReplayCsv({
      datasetId: "hash-mismatch",
      expectedSha256: SHA256,
      actualSha256: "b".repeat(64),
      csvText: VALID_CSV,
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toContain("SHA256_MISMATCH");
    expect(report.executionEligible).toBe(false);
  });

  it("fails closed on a non-minute gap", () => {
    const report = validateHistoricalReplayCsv({
      datasetId: "gap",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV.replace(
        "2025-08-01T00:01:00+00:00",
        "2025-08-01T00:02:00+00:00",
      ),
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toContain("ONE_MINUTE_GAP_AT_ROW_3");
  });

  it("fails closed when a valid decimal OHLC relation is inconsistent", () => {
    const report = validateHistoricalReplayCsv({
      datasetId: "inconsistent-ohlc",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV.replace(
        "1.14217,1.14217,1.14192,1.14194",
        "1.14217,1.14180,1.14220,1.14210",
      ),
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toContain("HIGH_BELOW_OPEN_AT_ROW_2");
    expect(report.rejectionReasons).toContain("HIGH_BELOW_CLOSE_AT_ROW_2");
    expect(report.rejectionReasons).toContain("LOW_ABOVE_OPEN_AT_ROW_2");
    expect(report.rejectionReasons).toContain("LOW_ABOVE_CLOSE_AT_ROW_2");
  });

  it("fails closed on duplicate timestamps and malformed price values", () => {
    const report = validateHistoricalReplayCsv({
      datasetId: "duplicate-and-price",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV.replace(
        "2025-08-01T00:01:00+00:00,1.14193",
        "2025-08-01T00:00:00+00:00,not-a-price",
      ),
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toContain("DUPLICATE_TIMESTAMP_AT_ROW_3");
    expect(report.rejectionReasons).toContain("INVALID_OPEN_AT_ROW_3");
  });

  it("fails closed when the source timezone header is absent", () => {
    const report = validateHistoricalReplayCsv({
      datasetId: "timezone-missing",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV.replace("Etc/UTC", "Local"),
    });

    expect(report.status).toBe("REJECTED");
    expect(report.rejectionReasons).toContain("INVALID_HEADER");
  });
});
