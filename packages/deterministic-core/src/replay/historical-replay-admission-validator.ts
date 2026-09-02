export type HistoricalReplayAdmissionStatus =
  | "ADMITTED_LOCAL_REPLAY"
  | "REJECTED";

export interface HistoricalReplayAdmissionInput {
  readonly datasetId: string;
  readonly expectedSha256: string;
  readonly actualSha256: string;
  readonly csvText: string;
}

export interface HistoricalReplayAdmissionReport {
  readonly datasetId: string;
  readonly status: HistoricalReplayAdmissionStatus;
  readonly dataRowCount: number;
  readonly coverageStartUtc?: string;
  readonly coverageEndUtc?: string;
  readonly rejectionReasons: readonly string[];
  readonly sourceKind: "REPLAY";
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly executionReportsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly externalRequestsMade: 0;
}

const REQUIRED_HEADER = "Etc/UTC,Open,High,Low,Close,Volume";
const SHA256 = /^[a-fA-F0-9]{64}$/;
const UTC_MINUTE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+00:00$/;
const NON_NEGATIVE_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function isCanonicalUtcMinuteTimestamp(value: string): boolean {
  if (!UTC_MINUTE_TIMESTAMP.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString() === value.replace("+00:00", ".000Z")
  );
}

function isPositiveDecimal(value: string): boolean {
  return (
    NON_NEGATIVE_DECIMAL.test(value) &&
    value.replaceAll("0", "").replaceAll(".", "").length > 0
  );
}

function comparePositiveDecimals(left: string, right: string): number {
  const [leftInteger, leftFraction = ""] = left.split(".");
  const [rightInteger, rightFraction = ""] = right.split(".");
  if (
    leftInteger === undefined ||
    rightInteger === undefined ||
    !isPositiveDecimal(left) ||
    !isPositiveDecimal(right)
  ) {
    throw new Error(
      "Historical Replay decimal comparison requires valid values",
    );
  }

  const normalizedLeftInteger = leftInteger.replace(/^0+(?=\d)/, "");
  const normalizedRightInteger = rightInteger.replace(/^0+(?=\d)/, "");
  if (normalizedLeftInteger.length !== normalizedRightInteger.length) {
    return normalizedLeftInteger.length < normalizedRightInteger.length
      ? -1
      : 1;
  }
  if (normalizedLeftInteger !== normalizedRightInteger) {
    return normalizedLeftInteger < normalizedRightInteger ? -1 : 1;
  }

  const fractionLength = Math.max(leftFraction.length, rightFraction.length);
  const normalizedLeftFraction = leftFraction.padEnd(fractionLength, "0");
  const normalizedRightFraction = rightFraction.padEnd(fractionLength, "0");
  if (normalizedLeftFraction === normalizedRightFraction) {
    return 0;
  }
  return normalizedLeftFraction < normalizedRightFraction ? -1 : 1;
}

function freezeReport(
  report: HistoricalReplayAdmissionReport,
): HistoricalReplayAdmissionReport {
  return Object.freeze({
    ...report,
    rejectionReasons: Object.freeze([...report.rejectionReasons]),
  });
}

/**
 * Validates an already-local CSV payload for historical Replay only. This
 * function has no filesystem, network, UI, Paper, risk, OMS, or execution
 * capability. An invalid input always remains execution-ineligible.
 */
export function validateHistoricalReplayCsv(
  input: Readonly<HistoricalReplayAdmissionInput>,
): HistoricalReplayAdmissionReport {
  if (input.datasetId.trim().length === 0) {
    throw new Error(
      "Historical Replay admission requires a non-empty datasetId",
    );
  }

  const reasons: string[] = [];
  if (!SHA256.test(input.expectedSha256) || !SHA256.test(input.actualSha256)) {
    reasons.push("INVALID_SHA256_FORMAT");
  } else if (
    input.expectedSha256.toLowerCase() !== input.actualSha256.toLowerCase()
  ) {
    reasons.push("SHA256_MISMATCH");
  }

  const lines = input.csvText.replace(/^\uFEFF/, "").split(/\r?\n/);
  const header = lines.shift();
  if (header !== REQUIRED_HEADER) {
    reasons.push("INVALID_HEADER");
  }

  const dataLines = lines.filter((line) => line.length > 0);
  if (dataLines.length === 0) {
    reasons.push("EMPTY_DATASET");
  }

  let previousTimestampMs: number | undefined;
  let coverageStartUtc: string | undefined;
  let coverageEndUtc: string | undefined;

  for (const [index, line] of dataLines.entries()) {
    const rowNumber = index + 2;
    const fields = line.split(",");
    if (fields.length !== 6) {
      reasons.push(`INVALID_COLUMN_COUNT_AT_ROW_${rowNumber}`);
      continue;
    }

    const [timestamp, open, high, low, close, volume] = fields;
    if (
      timestamp === undefined ||
      open === undefined ||
      high === undefined ||
      low === undefined ||
      close === undefined ||
      volume === undefined
    ) {
      reasons.push(`MISSING_FIELD_AT_ROW_${rowNumber}`);
      continue;
    }

    if (!isCanonicalUtcMinuteTimestamp(timestamp)) {
      reasons.push(`INVALID_UTC_TIMESTAMP_AT_ROW_${rowNumber}`);
      continue;
    }

    const priceFields = [
      ["OPEN", open],
      ["HIGH", high],
      ["LOW", low],
      ["CLOSE", close],
    ] as const;
    for (const [fieldName, value] of priceFields) {
      if (!isPositiveDecimal(value)) {
        reasons.push(`INVALID_${fieldName}_AT_ROW_${rowNumber}`);
      }
    }
    if (!isPositiveDecimal(volume)) {
      reasons.push(`INVALID_VOLUME_AT_ROW_${rowNumber}`);
    }

    if (priceFields.every(([, value]) => isPositiveDecimal(value))) {
      if (comparePositiveDecimals(high, open) < 0) {
        reasons.push(`HIGH_BELOW_OPEN_AT_ROW_${rowNumber}`);
      }
      if (comparePositiveDecimals(high, close) < 0) {
        reasons.push(`HIGH_BELOW_CLOSE_AT_ROW_${rowNumber}`);
      }
      if (comparePositiveDecimals(low, open) > 0) {
        reasons.push(`LOW_ABOVE_OPEN_AT_ROW_${rowNumber}`);
      }
      if (comparePositiveDecimals(low, close) > 0) {
        reasons.push(`LOW_ABOVE_CLOSE_AT_ROW_${rowNumber}`);
      }
    }

    const timestampMs = new Date(timestamp).getTime();
    if (previousTimestampMs !== undefined) {
      if (timestampMs === previousTimestampMs) {
        reasons.push(`DUPLICATE_TIMESTAMP_AT_ROW_${rowNumber}`);
      } else if (timestampMs < previousTimestampMs) {
        reasons.push(`TIMESTAMP_OUT_OF_ORDER_AT_ROW_${rowNumber}`);
      } else if (timestampMs - previousTimestampMs !== 60_000) {
        reasons.push(`ONE_MINUTE_GAP_AT_ROW_${rowNumber}`);
      }
    }

    previousTimestampMs = timestampMs;
    coverageStartUtc ??= timestamp;
    coverageEndUtc = timestamp;
  }

  return freezeReport({
    datasetId: input.datasetId,
    status: reasons.length === 0 ? "ADMITTED_LOCAL_REPLAY" : "REJECTED",
    dataRowCount: dataLines.length,
    ...(coverageStartUtc === undefined ? {} : { coverageStartUtc }),
    ...(coverageEndUtc === undefined ? {} : { coverageEndUtc }),
    rejectionReasons: reasons,
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}
