import { Database, FileSpreadsheet, ShieldAlert } from "lucide-react";
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
        دیتاست محلی تأییدشده از آزمون ساختاری عبور کرده است. این نما فقط شواهد
        اعتبارسنجی (Evidence) را نمایش می‌دهد و هیچ فایل یا دادهٔ حساسی در
        مرورگر نگهداری نمی‌شود.
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
                {historicalReplayPreview.map((candle) => (
                  <tr key={candle.cursor}>
                    <td className="cursor-cell">#{candle.cursor}</td>
                    <td className="timestamp-cell">{candle.timestampUtc}</td>
                    <td className="price-cell">{candle.open}</td>
                    <td className="price-cell price-high">{candle.high}</td>
                    <td className="price-cell price-low">{candle.low}</td>
                    <td className="price-cell price-close">{candle.close}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="safe-boundary-note">
        <ShieldAlert size={16} className="note-icon" />
        <span>
          این داده صرفاً تاریخی و آزمایشی است. در وضعیت کنونی هیچ معامله، سفارش،
          اجرای زنده یا حساب شبیه‌سازی متصل نیست.
        </span>
      </div>
    </section>
  );
}
