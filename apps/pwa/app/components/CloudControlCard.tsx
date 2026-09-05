import {
  Cloud,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import type { CloudSession } from "../firebase-client";

interface CloudControlCardProps {
  readonly cloudSession: CloudSession;
  readonly cloudBusy: boolean;
  readonly onSignIn: () => void;
  readonly onSignOut: () => void;
}

export function CloudControlCard({
  cloudSession,
  cloudBusy,
  onSignIn,
  onSignOut,
}: CloudControlCardProps) {
  const cloudStateLabel =
    cloudSession.kind === "signed-in"
      ? "هویت مالک تأیید شد"
      : cloudSession.kind === "signed-out"
        ? "ورود مالک لازم است"
        : cloudSession.kind === "error"
          ? cloudSession.reason === "domain-not-authorized"
            ? "دامنهٔ سایت در کنسول مجاز نیست"
            : cloudSession.reason === "network-unavailable"
              ? "ارتباط با سرور در دسترس نیست"
              : cloudSession.reason === "sign-in-cancelled"
                ? "ورود کاربر لغو شد"
                : "خطای ناشناخته در ورود"
          : "آماده احراز هویت";

  return (
    <section className="control-card" aria-labelledby="cloud-title">
      <div className="card-header">
        <div className="card-title-group">
          <Cloud size={19} className="card-icon" />
          <h2 id="cloud-title" className="card-title">
            کنترل ابری مالک (Cloud Control)
          </h2>
        </div>
        <span className="non-auth-badge" dir="ltr">
          NON-AUTHORITATIVE
        </span>
      </div>

      <p className="card-description">
        این بخش صرفاً برای احراز هویت مالک و نظارت تشخیصی بر وضعیت سیستم است و
        دسترسی به سفارشات یا ریسک ندارد.
      </p>

      <div className="card-key-values">
        <div className="kv-row">
          <span className="kv-label">اختیار اجرایی (Execution):</span>
          <strong className="kv-value danger-text" dir="ltr">
            DISABLED
          </strong>
        </div>
        <div className="kv-row">
          <span className="kv-label">محاسبه ریسک (Risk Core):</span>
          <strong className="kv-value danger-text" dir="ltr">
            LOCAL ONLY
          </strong>
        </div>
        <div className="kv-row">
          <span className="kv-label">وضعیت نشست کاربر:</span>
          <strong className="kv-value">{cloudStateLabel}</strong>
        </div>
      </div>

      <div className="card-actions">
        {cloudSession.kind === "signed-in" ? (
          <button
            className="secondary-button signout-button"
            onClick={onSignOut}
            disabled={cloudBusy}
          >
            <RefreshCw size={16} className={cloudBusy ? "spin" : ""} />
            <span>خروج امن از حساب کاربری</span>
          </button>
        ) : (
          <button
            className="primary-button-accent signin-button"
            onClick={onSignIn}
            disabled={cloudBusy}
          >
            <UserCheck size={16} />
            <span>
              {cloudBusy
                ? "در حال اتصال به سرویس..."
                : "ورود مالک با حساب کاربری"}
            </span>
          </button>
        )}
      </div>

      <div className="card-footer-note">
        <ShieldCheck size={14} className="footer-icon" />
        <span>
          ورود تنها جهت نظارت تشخیصی بوده و کلید‌های معاملاتی هرگز به سرور ارسال
          نمی‌شوند.
        </span>
      </div>
    </section>
  );
}
