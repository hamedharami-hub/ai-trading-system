import { ShieldAlert, CheckCircle2, Lock } from "lucide-react";

export function SystemInvariantsCard() {
  const invariants = [
    {
      title: "انحصار محاسبات قطعی",
      desc: "تنها نود محلی Local Trading Node اختیار محاسبه فیچرهای SMC، مدیریت ریسک و ارزیابی قوانین را دارد.",
    },
    {
      title: "هوش مصنوعی فاقد اختیار اجرایی",
      desc: "مدل‌های هوش مصنوعی صرفاً تحلیل‌گر و مشاورند؛ حق دستکاری قوانین، تعیین اندازه پوزیشن یا ورود به معامله را ندارند.",
    },
    {
      title: "رفتار پیش‌فرض Fail-Closed",
      desc: "در هرگونه شرایط قطعی داده، تعارض سیگنال، تأخیر زمانی یا خطای اعتبارسنجی، نتیجه قطعاً عدم معامله است.",
    },
    {
      title: "انزوای کامل کلیدها",
      desc: "هیچ کلید API، رمز عبور یا دیتای معاملاتی به کلود یا مرورگر ارسال یا در آن ذخیره نمی‌شود.",
    },
  ];

  return (
    <section
      className="control-card invariants-card"
      aria-labelledby="invariants-title"
    >
      <div className="card-header">
        <div className="card-title-group">
          <ShieldAlert size={19} className="card-icon warning" />
          <h2 id="invariants-title" className="card-title">
            اصول ایمنی بنیادین (Safety Invariants)
          </h2>
        </div>
        <span className="non-auth-badge" dir="ltr">
          LOCKED RULE
        </span>
      </div>

      <div className="invariants-list">
        {invariants.map((inv, idx) => (
          <div className="invariant-item" key={idx}>
            <div className="inv-icon">
              <CheckCircle2 size={16} />
            </div>
            <div className="inv-text">
              <strong>{inv.title}</strong>
              <p>{inv.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
