import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateHistoricalReplayCsv } from "../../src/replay/historical-replay-admission-validator.js";

const DATASET_ID = "dukascopy-eurusd-m1-bid-2025-08-01-utc";
const EXPECTED_SHA256 =
  "201435486B6DA10024938C3A45ADB13E715BDAF491E6A75C1C9FACFBA7AA93DB";
const QUARANTINED_DATASET = fileURLToPath(
  new URL(
    "../../../../data/historical-replay/quarantine/EUR-USD_1Minute_BID_2025-08-01_00_00-23_59_Etc_UTC.csv",
    import.meta.url,
  ),
);

describe("quarantined Dukascopy EURUSD M1 historical replay dataset", () => {
  it("admits only the exact local artifact recorded in DEC-132", () => {
    expect(existsSync(QUARANTINED_DATASET)).toBe(true);
    const csvText = readFileSync(QUARANTINED_DATASET, "utf8");
    const actualSha256 = createHash("sha256").update(csvText).digest("hex");
    const report = validateHistoricalReplayCsv({
      datasetId: DATASET_ID,
      expectedSha256: EXPECTED_SHA256,
      actualSha256,
      csvText,
    });

    expect(report).toMatchObject({
      datasetId: DATASET_ID,
      status: "ADMITTED_LOCAL_REPLAY",
      dataRowCount: 1260,
      coverageStartUtc: "2025-08-01T00:00:00+00:00",
      coverageEndUtc: "2025-08-01T20:59:00+00:00",
      sourceKind: "REPLAY",
      executionEligible: false,
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(report.rejectionReasons).toEqual([]);
  });
});
