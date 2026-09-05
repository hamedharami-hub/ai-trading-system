"use client";

import {
  History,
  ShieldCheck,
  FileCode,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type { AuditRecord } from "./types";

const auditRecords: ReadonlyArray<AuditRecord> = [
  {
    id: "AUD-001",
    event: "اعتبارسنجی دیتاست تاریخی Dukascopy EURUSD M1",
    detail: "تطابق هش‌های شواهد SHA-256 و ساختار استاندارد بدون گپ غیرمجاز",
    timestamp: "2025-08-01 21:00 UTC",
    status: "verified",
  },
  {
    id: "AUD-002",
    event: "تست بنچ‌مارک هوش مصنوعی آفلاین (Windows & Android)",
    detail:
      "پاسخ مدل در چارچوب JSON Schema ارزیابی شد؛ در غیاب داده قطعی معامله REJECT گردید",
    timestamp: "2026-09-05 09:15 UTC",
    status: "verified",
  },
  {
    id: "AUD-003",
    event: "تأیید انزوای هسته ریسک از لایه رابط کاربری (PWA)",
    detail: "عدم ارسال داده یا کلید به مرورگر و اعمال رفتار Fail-Closed قطعی",
    timestamp: "2026-09-05 09:20 UTC",
    status: "fail-closed",
  },
];

export function AuditLogPanel() {
  return (
    <section className="section-block" aria-labelledby="audit-title">
      <div className="section-heading">
        <div className="heading-group">
          <span className="eyeline">
            گزارش‌های ممیزی و رویدادهای غیرقابل تغییر
          </span>
          <h2 id="audit-title" className="section-title">
            <History size={18} className="title-icon" />
            <span>ممیزی محلی و لاگ سیستم (Append-Only Audit Log)</span>
          </h2>
        </div>
        <span className="subtle-status ltr-text" dir="ltr">
          APPEND-ONLY · IMMUTABLE
        </span>
      </div>

      <p className="section-description">
        تمامی رویدادهای سیستمی، اعتبارسنجی‌ها و تصمیمات به صورت زنجیره‌ای و
        غیرقابل بازنویسی ذخیره می‌شوند. در حال حاضر ۰ پوزیشن معاملاتی و ۰ کلید
        در بستر سیستم ذخیره شده است.
      </p>

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th scope="col">شناسه رویداد</th>
              <th scope="col">شرح رویداد</th>
              <th scope="col">جزئیات اعتبارسنجی</th>
              <th scope="col">زمان ثبت (UTC)</th>
              <th scope="col">وضعیت ایمنی</th>
            </tr>
          </thead>
          <tbody>
            {auditRecords.map((item) => (
              <tr key={item.id}>
                <td className="ltr-text audit-id" dir="ltr">
                  <strong>{item.id}</strong>
                </td>
                <td className="audit-event">{item.event}</td>
                <td className="audit-detail">{item.detail}</td>
                <td className="ltr-text audit-time" dir="ltr">
                  {item.timestamp}
                </td>
                <td>
                  <span
                    className={`audit-badge badge-${item.status}`}
                    dir="ltr"
                  >
                    {item.status === "verified" ? "VERIFIED" : "FAIL-CLOSED"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="audit-stats-row">
        <div className="stat-box">
          <span className="stat-label">تعداد آرتیفکت‌های معامله</span>
          <strong className="stat-num ltr-text" dir="ltr">
            0
          </strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">وضعیت لایسنس و دسترسی</span>
          <strong className="stat-num success-text ltr-text" dir="ltr">
            LOCAL WAL SECURE
          </strong>
        </div>
        <div className="stat-box">
          <span className="stat-label">سطح دسترسی اجرایی</span>
          <strong className="stat-num danger-text ltr-text" dir="ltr">
            DENY_ALL
          </strong>
        </div>
      </div>
    </section>
  );
}
