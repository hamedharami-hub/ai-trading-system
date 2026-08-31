"use client";

import {
  Activity,
  Bell,
  CheckCircle2,
  Cloud,
  Laptop,
  Menu,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  observeCloudSession,
  signInToCloudControl,
  signOutFromCloudControl,
  type CloudSession,
} from "./firebase-client";

type PanelId = "overview" | "devices" | "audit";

const panels: ReadonlyArray<{ id: PanelId; label: string }> = [
  { id: "overview", label: "نمای کلی" },
  { id: "devices", label: "دستگاه‌ها" },
  { id: "audit", label: "ممیزی" },
];

const advisoryRows = [
  { role: "Analyst", title: "شواهد کافی نیست", tone: "review" },
  { role: "Critic", title: "دادهٔ قطعی وارد نشده", tone: "blocked" },
  { role: "Judge", title: "اجرا نشده — شرط برقرار نیست", tone: "muted" },
] as const;

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<PanelId>("overview");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [cloudSession, setCloudSession] = useState<CloudSession>({
    kind: "not-configured",
  });
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => observeCloudSession(setCloudSession), []);

  function selectPanel(panel: PanelId) {
    setActivePanel(panel);
    setMobileNavigationOpen(false);
  }

  async function handleCloudControl() {
    setCloudBusy(true);
    const session = await signInToCloudControl();
    if (session !== null) {
      setCloudSession(session);
      setCloudBusy(false);
    }
  }

  async function handleSignOut() {
    setCloudBusy(true);
    await signOutFromCloudControl();
    setCloudBusy(false);
  }

  const cloudStateLabel =
    cloudSession.kind === "signed-in"
      ? "هویت مالک تأیید شد"
      : cloudSession.kind === "signed-out"
        ? "ورود لازم است"
        : cloudSession.kind === "error"
          ? cloudSession.reason === "domain-not-authorized"
            ? "دامنهٔ سایت در Firebase مجاز نیست"
            : cloudSession.reason === "network-unavailable"
              ? "ارتباط Firebase در دسترس نیست"
              : cloudSession.reason === "sign-in-cancelled"
                ? "ورود لغو شد"
                : "ورود ناموفق بود"
          : "پیکربندی Vercel لازم است";

  return (
    <main className="app-shell">
      <aside
        className={mobileNavigationOpen ? "sidebar sidebar-open" : "sidebar"}
        aria-label="ناوبری اصلی"
      >
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Activity size={20} />
          </span>
          <span>تحلیل معاملاتی</span>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileNavigationOpen(false)}
            aria-label="بستن ناوبری"
          >
            <X size={20} />
          </button>
        </div>
        <nav>
          {panels.map((panel) => (
            <button
              className={
                activePanel === panel.id
                  ? "navigation-item navigation-selected"
                  : "navigation-item"
              }
              key={panel.id}
              onClick={() => selectPanel(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={18} />
          <span>مرورگر هیچ اختیار ریسک یا سفارش ندارد.</span>
        </div>
      </aside>

      {mobileNavigationOpen ? (
        <button
          className="backdrop"
          onClick={() => setMobileNavigationOpen(false)}
          aria-label="بستن ناوبری"
        />
      ) : null}

      <section className="workspace">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMobileNavigationOpen(true)}
            aria-label="باز کردن ناوبری"
          >
            <Menu size={21} />
          </button>
          <div>
            <p className="eyeline">کنترل محلی</p>
            <h1>{panels.find((panel) => panel.id === activePanel)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="safe-state">
              <ShieldAlert size={16} /> ورود جدید مسدود است
            </span>
            <button
              className="icon-button"
              aria-label="اعلان‌ها"
              onClick={() => setNotificationEnabled((value) => !value)}
            >
              <Bell size={19} />
              <span className="sr-only">
                {notificationEnabled
                  ? "اعلان‌ها فعال‌اند"
                  : "اعلان‌ها غیرفعال‌اند"}
              </span>
            </button>
          </div>
        </header>

        <div className="content-grid">
          <section className="primary-column">
            <section className="status-banner" aria-label="وضعیت ایمنی">
              <div className="status-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2>حالت ایمن فعال است</h2>
                <p>
                  بدون دادهٔ معتبر و بدون تأیید قطعی، سامانه هیچ اقدام تازه‌ای
                  انجام نمی‌دهد.
                </p>
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <p className="eyeline">مسیر تحلیل</p>
                  <h2>وضعیت شورای تحلیلی</h2>
                </div>
                <span className="subtle-status">نمونهٔ محلی</span>
              </div>
              <ol className="process-line" aria-label="مسیر تصمیم قطعی">
                <li>MarketEvent</li>
                <li>FeatureSnapshot</li>
                <li>StrategyCandidate</li>
                <li>PolicyGate</li>
                <li>RiskDecision</li>
              </ol>
              <div className="advisory-list">
                {advisoryRows.map((row) => (
                  <article className="advisory-row" key={row.role}>
                    <span
                      className={`role-indicator ${row.tone}`}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{row.role}</strong>
                      <p>{row.title}</p>
                    </div>
                    <span className="advisory-label">تحلیلی</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-block audit-preview">
              <div className="section-heading">
                <div>
                  <p className="eyeline">رویدادها</p>
                  <h2>ممیزی محلی</h2>
                </div>
                <span className="subtle-status">append-only</span>
              </div>
              <div className="event-row">
                <CheckCircle2 size={18} />
                <span>قواعد UI از تصمیم قطعی جدا نگه داشته شدند.</span>
                <time>اکنون</time>
              </div>
              <div className="event-row">
                <CheckCircle2 size={18} />
                <span>خروجی AI صرفاً مشاهده‌پذیر است.</span>
                <time>اکنون</time>
              </div>
            </section>
          </section>

          <aside className="secondary-column">
            <section className="control-card">
              <div className="card-title">
                <Cloud size={19} />
                <h2>Cloud Control</h2>
              </div>
              <p>همگام‌سازی فقط برای وضعیت دستگاه و دادهٔ غیرحاکمیتی است.</p>
              <dl className="key-values">
                <div>
                  <dt>authority</dt>
                  <dd>ندارد</dd>
                </div>
                <div>
                  <dt>execution</dt>
                  <dd>خاموش</dd>
                </div>
                <div>
                  <dt>cloud state</dt>
                  <dd>{cloudStateLabel}</dd>
                </div>
              </dl>
              {cloudSession.kind === "signed-in" ? (
                <button
                  className="secondary-button"
                  onClick={handleSignOut}
                  disabled={cloudBusy}
                >
                  <RefreshCw size={17} /> خروج امن از Cloud Control
                </button>
              ) : (
                <button
                  className="secondary-button"
                  onClick={handleCloudControl}
                  disabled={cloudBusy}
                >
                  <Cloud size={17} />
                  {cloudBusy
                    ? "در حال انتقال به Google…"
                    : "ورود مالک با Google"}
                </button>
              )}
              <p className="control-note">
                ورود فقط برای نمایش وضعیت غیرحاکمیتی است؛ همگام‌سازی و pairing
                تا تکمیل revoke/recovery فعال نمی‌شوند.
              </p>
            </section>

            <section className="control-card">
              <div className="card-title">
                <MonitorSmartphone size={19} />
                <h2>pairing دستگاه</h2>
              </div>
              <div className="device-row">
                <Laptop size={19} />
                <span>Windows Local Node</span>
                <em>محلی</em>
              </div>
              <div className="device-row">
                <Smartphone size={19} />
                <span>Android companion</span>
                <em>منتظر pair</em>
              </div>
              <button className="secondary-button" disabled>
                pairing مسدود است — کنترل revoke/recovery لازم است
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
