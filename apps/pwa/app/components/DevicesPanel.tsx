import {
  Laptop,
  Smartphone,
  ShieldCheck,
  AlertOctagon,
  Link2Off,
} from "lucide-react";

export function DevicesPanel() {
  return (
    <section className="section-block" aria-labelledby="devices-title">
      <div className="section-heading">
        <div className="heading-group">
          <span className="eyeline">توپولوژی و وضعیت دستگاه‌های متصل</span>
          <h2 id="devices-title" className="section-title">
            <Laptop size={18} className="title-icon" />
            <span>دستگاه‌های محلی (Local Devices & Trust Boundaries)</span>
          </h2>
        </div>
        <span className="subtle-status ltr-text" dir="ltr">
          NON-AUTHORITATIVE
        </span>
      </div>

      <p className="section-description">
        بر اساس قوانین ایمنی سیستم، تنها نود محلی ویندوز مرجع محاسبات قطعی و
        ریسک است. دستگاه اندروید و مرورگر تحت هیچ شرایطی اختیار معاملاتی یا
        دسترسی به کلید خصوصی ندارند.
      </p>

      <div className="devices-list">
        <article className="device-card active-device">
          <div className="device-icon-box">
            <Laptop size={22} />
          </div>
          <div className="device-info">
            <div className="device-title-row">
              <strong>Windows Local Trading Node</strong>
              <span className="device-status-badge active" dir="ltr">
                LOCAL NODE · ISOLATED
              </span>
            </div>
            <p className="device-desc">
              نود قطعی معاملاتی، مسئول اعتبارسنجی داده، پردازش فیچرهای SMC،
              محاسبه قطعی ریسک و ثبت لاگ محلی SQLite.
            </p>
            <div className="device-specs" dir="ltr">
              <span>Node.js ESM · Strict TypeScript · Fail-Closed</span>
            </div>
          </div>
        </article>

        <article className="device-card standby-device">
          <div className="device-icon-box">
            <Smartphone size={22} />
          </div>
          <div className="device-info">
            <div className="device-title-row">
              <strong>Android Companion Device</strong>
              <span className="device-status-badge standby" dir="ltr">
                STANDBY · PAIRING LOCKED
              </span>
            </div>
            <p className="device-desc">
              دستگاه همراه برای دریافت اعلان‌های تشخیصی و اجرای مدل‌های سبک
              آفلاین با llama.android؛ فاقد اختیار اجرایی.
            </p>
            <div className="device-specs" dir="ltr">
              <span>Kotlin / Compose · Local NPU · Read-Only</span>
            </div>
          </div>
        </article>
      </div>

      <div className="pairing-lock-card">
        <div className="lock-header">
          <Link2Off size={18} className="lock-icon" />
          <strong>وضعیت اتصال میان‌دستگاهی (Cross-Device Pairing)</strong>
        </div>
        <p>
          طبق تصمیم <strong>OPEN-021</strong>، تا زمان پیاده‌سازی کامل
          پروتکل‌های احراز هویت دوجانبه (mTLS) و مکانیزم ابطال کلید (Revocation
          & Recovery)، جفت‌سازی مستقیم مسدود است و داده‌ها تنها به‌صورت محلی
          باقی می‌مانند.
        </p>
      </div>
    </section>
  );
}
