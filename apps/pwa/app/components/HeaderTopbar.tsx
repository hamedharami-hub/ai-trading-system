import { Menu, ShieldAlert, Bell, BellOff } from "lucide-react";
import type { PanelId } from "./types";
import { navItems } from "./SidebarNav";

interface HeaderTopbarProps {
  readonly activePanel: PanelId;
  readonly onOpenMobileNav: () => void;
  readonly notificationEnabled: boolean;
  readonly onToggleNotification: () => void;
}

export function HeaderTopbar({
  activePanel,
  onOpenMobileNav,
  notificationEnabled,
  onToggleNotification,
}: HeaderTopbarProps) {
  const currentItem = navItems.find((item) => item.id === activePanel);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button menu-button"
          onClick={onOpenMobileNav}
          aria-label="باز کردن ناوبری"
        >
          <Menu size={22} />
        </button>
        <div className="title-block">
          <span className="eyeline">کنترل پنل نظارتی محلی</span>
          <h1 className="page-title">{currentItem?.label || "داشبورد"}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="safe-state-pill" title="حالت Fail-Closed فعال است">
          <ShieldAlert size={16} className="state-icon" />
          <span className="state-text">
            معاملات زنده مسدود است (Fail-Closed)
          </span>
        </div>

        <button
          className={`icon-button notification-button ${
            notificationEnabled ? "notif-active" : ""
          }`}
          aria-label={
            notificationEnabled
              ? "اعلان‌ها فعال هستند"
              : "اعلان‌ها غیرفعال هستند"
          }
          onClick={onToggleNotification}
          title={
            notificationEnabled
              ? "اعلان‌ها فعال هستند"
              : "اعلان‌ها غیرفعال هستند"
          }
        >
          {notificationEnabled ? <Bell size={18} /> : <BellOff size={18} />}
        </button>
      </div>
    </header>
  );
}
