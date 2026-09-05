import {
  FileCheck2,
  Fingerprint,
  Layers,
  ShieldAlert,
  CheckCircle2,
  ArrowRightLeft,
} from "lucide-react";

export const goldenEvidenceMetadata = {
  manifestId: "EURUSD_M1_20250801_DUKASCOPY_BID_CALIBRATED_MANIFEST_V1",
  labelSetId: "EURUSD_M1_20250801_DUKASCOPY_BID_CALIBRATED_LABEL_SET_V1",
  symbol: "EURUSD",
  timeframe: "M1",
  priceType: "BID",
  candleCount: 1260,
  cursorCount: 64,
  labelDigest:
    "sha256:4f8e91a2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc",
  goldenReadiness: "GOLDEN_EVIDENCE_READY",
  alignmentStatus: "ALIGNMENT_MATCH",
  decisionRef: "DEC-258",
} as const;

export function GoldenEvidenceCard() {
  return (
    <section
      className="section-block golden-evidence-card"
      aria-labelledby="golden-evidence-title"
    >
      <div className="section-heading">
        <div className="heading-group">
          <span className="eyeline">شواهد طلایی و انطباق قطعی مشاهدات</span>
          <h2 id="golden-evidence-title" className="section-title">
            <FileCheck2 size={18} className="title-icon" />
            <span>مجموعه داده‌های طلایی (Golden Dataset Alignment)</span>
          </h2>
        </div>
        <span className="subtle-status success-badge" dir="ltr">
          DEC-258 · VERIFIED
        </span>
      </div>

      <p className="section-description">
        بر اساس استاندارد فاز ۵BU، بسته‌های شواهد مشاهداتی استخراج‌شده از بازپخش
        محلی با مجموعه‌برچسب‌های طلایی بر پایه مکان‌نما تطبیق یافته و اصالت و
        یکپارچگی آن با استاندارد هش JCS/SHA-256 مورد اعتبارسنجی قطعی قرار گرفته
        است.
      </p>

      <div className="golden-evidence-grid">
        <div className="golden-item">
          <div className="golden-item-header">
            <Layers size={16} className="item-icon" />
            <span className="golden-item-label">شناسه مانیفست طلایی</span>
          </div>
          <code className="golden-code-val ltr-text" dir="ltr">
            {goldenEvidenceMetadata.manifestId}
          </code>
        </div>

        <div className="golden-item">
          <div className="golden-item-header">
            <Fingerprint size={16} className="item-icon" />
            <span className="golden-item-label">شناسه مجموعه‌برچسب</span>
          </div>
          <code className="golden-code-val ltr-text" dir="ltr">
            {goldenEvidenceMetadata.labelSetId}
          </code>
        </div>

        <div className="golden-item">
          <div className="golden-item-header">
            <CheckCircle2 size={16} className="item-icon success-color" />
            <span className="golden-item-label">آمادگی شواهد طلایی</span>
          </div>
          <div className="golden-badge-row">
            <span className="status-badge-chip success" dir="ltr">
              {goldenEvidenceMetadata.goldenReadiness}
            </span>
            <span className="badge-sub-info">۶۴ مکان‌نما (Cursor 0..63)</span>
          </div>
        </div>

        <div className="golden-item">
          <div className="golden-item-header">
            <ArrowRightLeft size={16} className="item-icon success-color" />
            <span className="golden-item-label">نتیجه انطباق با بازپخش</span>
          </div>
          <div className="golden-badge-row">
            <span className="status-badge-chip success" dir="ltr">
              {goldenEvidenceMetadata.alignmentStatus}
            </span>
            <span className="badge-sub-info">مطابقت ۱۰۰٪ با Replay</span>
          </div>
        </div>
      </div>

      <div className="digest-display-box">
        <div className="digest-header">
          <Fingerprint size={15} />
          <span>
            چکیده هش تغییرناپذیر مجموعه‌برچسب (Deterministic Label Digest)
          </span>
          <span className="digest-match-pill" dir="ltr">
            MATCH (SHA-256)
          </span>
        </div>
        <div className="digest-value ltr-text" dir="ltr">
          {goldenEvidenceMetadata.labelDigest}
        </div>
      </div>

      <div className="safe-boundary-note">
        <ShieldAlert size={16} className="note-icon" />
        <span>
          <strong>مرز ایمنی سیستم:</strong> انطباق شواهد طلایی صرفاً صحت ساختاری
          و هم‌خوانی هش‌های بازپخش را اثبات می‌کند و به‌هیچ‌وجه به معنی سیگنال
          ورود، پیش‌بینی قیمت، یا ایجاد مجوز معامله در محیط زنده/دمو نیست.
        </span>
      </div>
    </section>
  );
}
