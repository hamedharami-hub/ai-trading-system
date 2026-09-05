import { ShieldCheck, Lock } from "lucide-react";

export function SafetyBanner() {
  return (
    <section className="status-banner" aria-label="وضعیت ایمنی سامانه">
      <div className="status-icon" aria-hidden="true">
        <ShieldCheck size={24} />
      </div>
      <div className="status-content">
        <div className="status-header">
          <h2>حالت ایمن فعال است (Fail-Closed)</h2>
          <span className="safe-badge-pill" dir="ltr">
            <Lock size={12} />
            <span>DENY_ONLY · ACTIVE</span>
          </span>
        </div>
        <p>
          بدون دادهٔ اعتبارسنجی‌شده و بدون تأیید قطعی نود محلی، سامانه هیچ
          پوزیشن یا اقدام معاملاتی ایجاد نمی‌کند. مرورگر فاقد کلید خصوصی و فاقد
          اختیار سفارش است.
        </p>
      </div>
    </section>
  );
}
