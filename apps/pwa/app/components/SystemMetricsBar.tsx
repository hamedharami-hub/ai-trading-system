import { ShieldAlert, Database, CheckCircle2, Lock } from "lucide-react";
import type { QuickMetricItem } from "./types";

export const systemMetrics: ReadonlyArray<QuickMetricItem> = [
  {
    id: "security",
    label: "وضعیت ایمنی نود",
    value: "Fail-Closed",
    subValue: "حالت DENY_ONLY فعال",
    status: "locked",
    dir: "ltr",
  },
  {
    id: "replay",
    label: "بازپخش داده‌های محلی",
    value: "EURUSD · M1",
    subValue: "۱,۲۶۰ ردیف کالیبره‌شده",
    status: "info",
    dir: "ltr",
  },
  {
    id: "golden",
    label: "انطباق شواهد طلایی",
    value: "ALIGNMENT_MATCH",
    subValue: "۶۴ مکان‌نما (Cursor 0..63)",
    status: "success",
    dir: "ltr",
  },
  {
    id: "execution",
    label: "اختیار سفارش و معامله",
    value: "0 Trades · Locked",
    subValue: "فاقد اتصال به بروکر / حساب",
    status: "locked",
    dir: "ltr",
  },
];

export function SystemMetricsBar() {
  const getIcon = (status: QuickMetricItem["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 size={16} className="metric-icon-success" />;
      case "locked":
        return <Lock size={16} className="metric-icon-locked" />;
      case "warning":
        return <ShieldAlert size={16} className="metric-icon-warning" />;
      default:
        return <Database size={16} className="metric-icon-info" />;
    }
  };

  return (
    <div
      className="system-metrics-bar"
      role="region"
      aria-label="خلاصه شاخص‌های پایش سیستم"
    >
      {systemMetrics.map((metric) => (
        <div key={metric.id} className={`metric-card status-${metric.status}`}>
          <div className="metric-header">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-icon">{getIcon(metric.status)}</span>
          </div>
          <div className="metric-body">
            <strong
              className={`metric-value ${metric.dir === "ltr" ? "ltr-text" : ""}`}
              dir={metric.dir || "rtl"}
            >
              {metric.value}
            </strong>
            {metric.subValue ? (
              <span className="metric-subvalue">{metric.subValue}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
