export type PanelId =
  | "overview"
  | "replay"
  | "golden"
  | "council"
  | "devices"
  | "audit";

export interface NavItem {
  readonly id: PanelId;
  readonly label: string;
  readonly badge?: string;
  readonly shortcutHint?: string;
}

export interface QuickMetricItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly subValue?: string;
  readonly status: "success" | "warning" | "locked" | "info";
  readonly dir?: "ltr" | "rtl";
}

export interface OfflineAiBenchmark {
  readonly platform: string;
  readonly runtime: string;
  readonly result: "REJECT" | "APPROVE" | "REANALYZE";
  readonly duration: string;
  readonly detail: string;
}

export interface HistoricalReplayPreviewCandle {
  readonly cursor: string;
  readonly timestampUtc: string;
  readonly open: string;
  readonly high: string;
  readonly low: string;
  readonly close: string;
}

export interface AdvisoryRow {
  readonly role: string;
  readonly title: string;
  readonly tone: "review" | "blocked" | "muted" | "approved";
  readonly description: string;
}

export interface AuditRecord {
  readonly id: string;
  readonly event: string;
  readonly detail: string;
  readonly timestamp: string;
  readonly status: "verified" | "fail-closed";
}
