import { Cpu, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { OfflineAiBenchmark } from "./types";

export const offlineAiBenchmarks: ReadonlyArray<OfflineAiBenchmark> = [
  {
    platform: "ویندوز (Local Node)",
    runtime: "llama.cpp local CPU · 4 Threads",
    result: "REJECT",
    duration: "4,147 ms",
    detail:
      "اعتبارسنجی قطعی خروجی JSON طبق JSON Schema؛ به دلیل نبود شواهد کافی معامله رد شد.",
  },
  {
    platform: "اندروید (Pixel 9 Pro Fold)",
    runtime: "llama.android local NPU/CPU",
    result: "REJECT",
    duration: "35,618 ms",
    detail:
      "بنچ‌مارک آفلاین؛ در نبود شواهد قطعی بازار، وضعیت Fail-Closed حفظ و معامله رد شد.",
  },
];

export function OfflineAiBenchmarkCard() {
  return (
    <section className="section-block" aria-labelledby="offline-ai-title">
      <div className="section-heading">
        <div className="heading-group">
          <span className="eyeline">شواهد آزمون عملکردی مدل‌های محلی</span>
          <h2 id="offline-ai-title" className="section-title">
            <Cpu size={18} className="title-icon" />
            <span>هوش مصنوعی آفلاین و محلی (Offline AI Benchmarks)</span>
          </h2>
        </div>
        <span className="subtle-status ltr-text" dir="ltr">
          BENCHMARK · NON-AUTHORITATIVE
        </span>
      </div>

      <p className="section-description">
        مدل‌های محلی صرفاً نقش مشورتی و تحلیلی دارند و هیچ‌گونه اختیار ریسک،
        اندازه پوزیشن یا صدور سفارش ندارند. این نتایج صرفاً برای ارزیابی زمان
        پاسخ و ساختار خروجی است.
      </p>

      <div className="offline-ai-benchmark-list">
        {offlineAiBenchmarks.map((benchmark) => (
          <article
            className="offline-ai-benchmark-card"
            key={benchmark.platform}
          >
            <div className="benchmark-header">
              <div className="platform-info">
                <strong>{benchmark.platform}</strong>
                <span className="runtime-label ltr-text" dir="ltr">
                  {benchmark.runtime}
                </span>
              </div>
              <div className="benchmark-tags" dir="ltr">
                <span className="result-pill reject-pill">
                  {benchmark.result}
                </span>
                <span className="duration-pill">{benchmark.duration}</span>
              </div>
            </div>

            <p className="benchmark-detail">{benchmark.detail}</p>
          </article>
        ))}
      </div>

      <div className="ai-safety-alert">
        <ShieldCheck size={16} className="alert-icon" />
        <span>
          نتیجه <strong>REJECT</strong> یعنی هوش مصنوعی در غیاب شواهد قطعی و
          نمره A+، به حالت ایمن (Fail-Closed) بازگشته است.
        </span>
      </div>
    </section>
  );
}
