"use client";

import {
  GitMerge,
  UserCheck,
  Shield,
  AlertTriangle,
  Scale,
  History,
} from "lucide-react";
import type { AdvisoryRow } from "./types";

const advisoryRoles: ReadonlyArray<AdvisoryRow> = [
  {
    role: "Analyst (تحلیل‌گر)",
    title: "بررسی شواهد ساختار، مومنتوم و دیسپلیس‌منت (DEC-262)",
    tone: "review",
    description:
      "بررسی الگوهای ساختار بازار و ارائه پیشنهاد مشورتی (FAVORABLE / NEUTRAL / UNFAVORABLE) بدون اختیار صدور سفارش.",
  },
  {
    role: "Critic (منتقد مستقل)",
    title: "نقد ساختار، نسبت ریوارد به ریسک و نقدینگی مقابل (DEC-262)",
    tone: "blocked",
    description:
      "نقش ارزیابی بدبینانه سناریوهای زیان‌ده، انقضای کندل‌ها و صدور پیشنهاد تحلیلی مستقل جهت محافظت از سرمایه.",
  },
  {
    role: "Judge (قاضی مشروط)",
    title: "حل تعارض مادی یا نظارت بر کاندیدای A+ (DEC-264)",
    tone: "muted",
    description:
      "تنها در صورت تعارض مادی میان تحلیل‌گر و منتقد یا کاندیدای گرید A+ فراخوانی شده و خروجی منحصراً APPROVE، REJECT یا REANALYZE با سقف بازتحلیل محدود است.",
  },
  {
    role: "Post-Trade Auditor (حسابرس)",
    title: "خارج از مسیر زنده — صرفاً گزارش‌گیری",
    tone: "muted",
    description:
      "حسابرسی مقایسه‌ای تصمیم‌ها و نتایج در محیط آفلاین؛ فاقد توانایی تغییر پارامترها و کد.",
  },
];

const deterministicPipeline = [
  { step: "1", name: "MarketEvent", desc: "کندل‌های قطعی OHLC" },
  { step: "2", name: "FeatureSnapshot", desc: "شاخص‌های قطعی SMC" },
  { step: "3", name: "StrategyCandidate", desc: "کاندیدای گرید A/A+ (DEC-260)" },
  { step: "4", name: "CouncilProposals", desc: "شورا: تحلیل‌گر و منتقد (DEC-262)" },
  { step: "5", name: "JudgeDecision", desc: "قاضی مشروط: حل تعارض (DEC-264)" },
  { step: "6", name: "PolicyGate", desc: "دروازه انطباق قوانین" },
  { step: "7", name: "RiskDecision", desc: "محاسبه قطعی ریسک" },
];

export function AdvisoryCouncilCard() {
  return (
    <section className="section-block" aria-labelledby="council-title">
      <div className="section-heading">
        <div className="heading-group">
          <span className="eyeline">معماری تصمیم‌گیری قطعی و لایه تحلیلی</span>
          <h2 id="council-title" className="section-title">
            <Scale size={18} className="title-icon" />
            <span>شورای تحلیلی و خط لوله قطعی (Decision Pipeline)</span>
          </h2>
        </div>
        <span className="subtle-status ltr-text" dir="ltr">
          DETERMINISTIC · STRICT GATES
        </span>
      </div>

      <div className="pipeline-container">
        <span className="pipeline-title">
          خط لوله تصمیم‌گیری قطعی نود محلی (Local Node)
        </span>
        <div className="pipeline-steps">
          {deterministicPipeline.map((p, idx) => (
            <div className="pipeline-step-item" key={p.step}>
              <div className="step-badge">
                <span className="step-num">{p.step}</span>
                <span className="step-name ltr-text" dir="ltr">
                  {p.name}
                </span>
              </div>
              <span className="step-desc">{p.desc}</span>
              {idx < deterministicPipeline.length - 1 ? (
                <span className="step-arrow" aria-hidden="true">
                  ←
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="advisory-roles-list">
        {advisoryRoles.map((role) => (
          <article
            className={`advisory-card advisory-${role.tone}`}
            key={role.role}
          >
            <div className="advisory-card-header">
              <div className="role-heading">
                <span
                  className={`role-indicator-dot tone-${role.tone}`}
                  aria-hidden="true"
                />
                <strong className="role-title">{role.role}</strong>
              </div>
              <span className="advisory-tag">صرفاً مشورتی</span>
            </div>
            <div className="advisory-state-line">
              <span className="state-label">وضعیت:</span>
              <span className="state-value">{role.title}</span>
            </div>
            <p className="role-description">{role.description}</p>
          </article>
        ))}
      </div>

      <div className="invariants-reminder">
        <span>
          <strong>اصل تفکیک قدرت:</strong> هیچ مدل هوش مصنوعی توانایی دستکاری
          قوانین ریسک، محاسبه سایز موقعیت یا صدور مستقیم سفارش را ندارد.
        </span>
      </div>
    </section>
  );
}
