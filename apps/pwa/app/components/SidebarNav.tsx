import {
  Activity,
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  Cpu,
  Laptop,
  History,
  ShieldCheck,
  X,
} from "lucide-react";
import type { NavItem, PanelId } from "./types";

interface SidebarNavProps {
  readonly activePanel: PanelId;
  readonly onSelectPanel: (panel: PanelId) => void;
  readonly isOpenMobile: boolean;
  readonly onCloseMobile: () => void;
}

export const navItems: ReadonlyArray<NavItem> = [
  { id: "overview", label: "نمای کلی سیستم", shortcutHint: "Alt+1" },
  {
    id: "replay",
    label: "بازپخش داده‌ها (Replay)",
    badge: "EURUSD",
    shortcutHint: "Alt+2",
  },
  {
    id: "golden",
    label: "شواهد طلایی (Golden)",
    badge: "DEC-258",
    shortcutHint: "Alt+3",
  },
  { id: "council", label: "شورای تحلیلی و AI", shortcutHint: "Alt+4" },
  { id: "devices", label: "پایش دستگاه‌ها", shortcutHint: "Alt+5" },
  {
    id: "audit",
    label: "ممیزی و رویدادها",
    badge: "0 Trades",
    shortcutHint: "Alt+6",
  },
];

export function SidebarNav({
  activePanel,
  onSelectPanel,
  isOpenMobile,
  onCloseMobile,
}: SidebarNavProps) {
  const getIcon = (id: PanelId) => {
    switch (id) {
      case "overview":
        return <LayoutDashboard size={18} />;
      case "replay":
        return <FileSpreadsheet size={18} />;
      case "golden":
        return <FileCheck2 size={18} />;
      case "council":
        return <Cpu size={18} />;
      case "devices":
        return <Laptop size={18} />;
      case "audit":
        return <History size={18} />;
    }
  };

  return (
    <>
      <aside
        className={`sidebar ${isOpenMobile ? "sidebar-open" : ""}`}
        aria-label="ناوبری اصلی سامانه"
      >
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Activity size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-name">سامانه تحلیل معاملاتی</span>
            <span className="brand-subtitle">معماری قطعی · نود محلی</span>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={onCloseMobile}
            aria-label="بستن منوی ناوبری"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const isSelected = activePanel === item.id;
            return (
              <button
                key={item.id}
                className={`nav-button ${isSelected ? "nav-selected" : ""}`}
                onClick={() => onSelectPanel(item.id)}
              >
                <span className="nav-icon">{getIcon(item.id)}</span>
                <span className="nav-label">{item.label}</span>
                <div className="nav-trailing-meta">
                  {item.badge ? (
                    <span className="nav-badge" dir="ltr">
                      {item.badge}
                    </span>
                  ) : null}
                  {item.shortcutHint ? (
                    <kbd
                      className="nav-kbd ltr-text"
                      dir="ltr"
                      title={`کلید میانبر: ${item.shortcutHint}`}
                    >
                      {item.shortcutHint}
                    </kbd>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer-note">
          <div className="footer-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="footer-text">
            <strong>قانون تفکیک اختیارات</strong>
            <p>مرورگر تنها لایه نمایش بوده و فاقد اختیار ریسک یا معامله است.</p>
          </div>
        </div>
      </aside>

      {isOpenMobile ? (
        <button
          className="backdrop"
          onClick={onCloseMobile}
          aria-label="بستن پیش‌زمینه ناوبری"
        />
      ) : null}
    </>
  );
}
