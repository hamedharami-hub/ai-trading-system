"use client";

import { useMemo, useState } from "react";
import {
  CalendarRange,
  Database,
  FileSpreadsheet,
  ShieldAlert,
} from "lucide-react";
import type { HistoricalReplayPreviewCandle } from "./types";

interface HistoricalReplayCardProps {
  readonly showTable?: boolean;
}

export const historicalReplayEvidence = {
  dataset: "EURUSD · M1 · Bid",
  source: "Dukascopy Historical Data Export",
  coverage: "2025-08-01 · 00:00 - 20:59 UTC",
  rows: "1,260 ردیف کالیبره‌شده",
  status: "ADMITTED_LOCAL_REPLAY",
  digest: "sha256:4f8e...3b21",
} as const;

export const historicalReplayPreview: ReadonlyArray<HistoricalReplayPreviewCandle> =
  [
    {
      cursor: "0",
      timestampUtc: "2025-08-01T00:00:00+00:00",
      open: "1.14217",
      high: "1.14217",
      low: "1.14192",
      close: "1.14194",
    },
    {
      cursor: "1",
      timestampUtc: "2025-08-01T00:01:00+00:00",
      open: "1.14193",
      high: "1.14193",
      low: "1.14153",
      close: "1.14161",
    },
    {
      cursor: "2",
      timestampUtc: "2025-08-01T00:02:00+00:00",
      open: "1.14161",
      high: "1.14180",
      low: "1.14157",
      close: "1.14173",
    },
    {
      cursor: "3",
      timestampUtc: "2025-08-01T00:03:00+00:00",
      open: "1.14176",
      high: "1.14209",
      low: "1.14175",
      close: "1.14208",
    },
    {
      cursor: "4",
      timestampUtc: "2025-08-01T00:04:00+00:00",
      open: "1.14207",
      high: "1.14207",
      low: "1.14176",
      close: "1.14178",
    },
  ];

export function HistoricalReplayCard({
  showTable = true,
}: HistoricalReplayCardProps) {
  const [rangeStart, setRangeStart] = useState("2025-08-01T00:00");
  const [rangeEnd, setRangeEnd] = useState("2025-08-01T00:04");

  const rangeState = useMemo(() => {
    const start = new Date(`${rangeStart}:00.000Z`).getTime();
    const end = new Date(`${rangeEnd}:00.000Z`).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return { kind: "INVALID" } as const;
    }

    const candles = historicalReplayPreview.filter((candle) => {
      const timestamp = new Date(candle.timestampUtc).getTime();
      return timestamp >= start && timestamp <= end;
    });
    return candles.length === 0
      ? ({ kind: "EMPTY" } as const)
      : ({ kind: "RANGE", candles } as const);
  }, [rangeEnd, rangeStart]);

  return (
    <section
      className="section-block replay-evidence"
      aria-labelledby="replay-title"
    >
      <div className="section-heading">
        <div className="heading-group">
          <span className="eyeline">داده‌های قطعی و شواهد آزمون</span>
          <h2 id="replay-title" className="section-title">
            <FileSpreadsheet size={18} className="title-icon" />
            <span>بازپخش داده‌های تاریخی (Historical Replay)</span>
          </h2>
        </div>
        <span className="subtle-status replay-evidence-status" dir="ltr">
          HISTORICAL · NON-EXECUTABLE
        </span>
      </div>

      <p className="section-description">
        catalog محلیِ دادهٔ تاریخی به شما اجازه می‌دهد بازهٔ مورد نظر را انتخاب
        و coverage موجود را بررسی کنید. اتصال Dukascopy و دریافت داده در بستهٔ
        ۵.۴ به Local Trading Node افزوده می‌شود؛ مرورگر هرگز مستقیماً به
        provider وصل نمی‌شود.
      </p>

      <div className="metadata-grid">
        <div className="meta-item">
          <span className="meta-label">نماد و تایم‌فریم</span>
          <strong className="meta-value ltr-text" dir="ltr">
            {historicalReplayEvidence.dataset}
          </strong>
        </div>
        <div className="meta-item">
          <span className="meta-label">منبع اصلی دیتا</span>
          <strong className="meta-value ltr-text" dir="ltr">
            {historicalReplayEvidence.source}
          </strong>
        </div>
        <div className="meta-item">
          <span className="meta-label">بازه زمانی تحت پوشش</span>
          <strong className="meta-value ltr-text" dir="ltr">
            {historicalReplayEvidence.coverage}
          </strong>
        </div>
        <div className="meta-item">
          <span className="meta-label">وضعیت پذیرش محلی</span>
          <strong className="meta-value success-badge" dir="ltr">
            {historicalReplayEvidence.status}
          </strong>
        </div>
      </div>

      <div className="historical-range-controls" aria-labelledby="range-title">
        <div className="range-control-heading">
          <div>
            <span className="eyeline">بستهٔ ۵.۱ · انتخاب بازه</span>
            <h3 id="range-title" className="sub-title">
              <CalendarRange size={17} className="title-icon" />
              مشاهدهٔ بازهٔ تاریخیِ پذیرفته‌شده
            </h3>
          </div>
          <span className="subtle-status ltr-text" dir="ltr">
            UTC · LOCAL CATALOG
          </span>
        </div>

        <div className="range-input-grid">
          <label className="range-field">
            <span>شروع بازه (UTC)</span>
            <input
              type="datetime-local"
              value={rangeStart}
              min="2025-08-01T00:00"
              max="2025-08-01T20:59"
              onChange={(event) => setRangeStart(event.target.value)}
              aria-label="شروع بازهٔ تاریخی بر اساس UTC"
            />
          </label>
          <label className="range-field">
            <span>پایان بازه (UTC)</span>
            <input
              type="datetime-local"
              value={rangeEnd}
              min="2025-08-01T00:00"
              max="2025-08-01T20:59"
              onChange={(event) => setRangeEnd(event.target.value)}
              aria-label="پایان بازهٔ تاریخی بر اساس UTC"
            />
          </label>
        </div>

        <p className="range-result" role="status">
          {rangeState.kind === "RANGE"
            ? `${rangeState.candles.length} کندل در snapshot محلیِ انتخاب‌شده قابل مشاهده است.`
            : rangeState.kind === "EMPTY"
              ? "در snapshot محلی برای این بازه کندلی وجود ندارد."
              : "پایان بازه باید پس از شروع بازه یا برابر با آن باشد."}
        </p>
      </div>

      {showTable ? (
        <div className="replay-preview" aria-labelledby="replay-preview-title">
          <div className="replay-preview-heading">
            <div>
              <span className="eyeline">نمونه ثابت (Fixed Snapshot)</span>
              <h3 id="replay-preview-title" className="sub-title">
                ۵ کندل نخست بازپخش (Cursors 0..4)
              </h3>
            </div>
            <span className="subtle-status ltr-text" dir="ltr">
              M1 OHLC · DUKASCOPY
            </span>
          </div>

          <div className="replay-preview-table-wrap">
            <table className="replay-preview-table" dir="ltr">
              <caption>EURUSD · M1 · Bid · Dukascopy Raw Feed · UTC</caption>
              <thead>
                <tr>
                  <th scope="col">Cursor</th>
                  <th scope="col">UTC Timestamp</th>
                  <th scope="col">Open</th>
                  <th scope="col">High</th>
                  <th scope="col">Low</th>
                  <th scope="col">Close</th>
                </tr>
              </thead>
              <tbody>
                {rangeState.kind === "RANGE"
                  ? rangeState.candles.map((candle) => (
                      <tr key={candle.cursor}>
                        <td className="cursor-cell">#{candle.cursor}</td>
                        <td className="timestamp-cell">
                          {candle.timestampUtc}
                        </td>
                        <td className="price-cell">{candle.open}</td>
                        <td className="price-cell price-high">{candle.high}</td>
                        <td className="price-cell price-low">{candle.low}</td>
                        <td className="price-cell price-close">
                          {candle.close}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="safe-boundary-note">
        <ShieldAlert size={16} className="note-icon" />
        <span>
          این catalog صرفاً دادهٔ تاریخیِ محلی را نمایش می‌دهد. در این بسته هیچ
          اتصال Dukascopy، سفارش، معامله، Paper fill یا اجرای زنده ایجاد
          نمی‌شود.
        </span>
      </div>
    </section>
  );
}
