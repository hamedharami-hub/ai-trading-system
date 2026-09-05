"use client";

import {
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  Cpu,
  History,
} from "lucide-react";
import type { PanelId } from "./types";

interface BottomNavMobileProps {
  readonly activePanel: PanelId;
  readonly onSelectPanel: (panel: PanelId) => void;
}

interface MobileTabItem {
  readonly id: PanelId;
  readonly label: string;
  readonly icon: typeof LayoutDashboard;
  readonly badge?: string;
}

const mobileTabs: ReadonlyArray<MobileTabItem> = [
  { id: "overview", label: "داشبورد", icon: LayoutDashboard },
  { id: "replay", label: "بازپخش", icon: FileSpreadsheet },
  { id: "golden", label: "شواهد طلایی", icon: FileCheck2, badge: "DEC-258" },
  { id: "council", label: "شورا و AI", icon: Cpu },
  { id: "audit", label: "ممیزی", icon: History },
];

export function BottomNavMobile({
  activePanel,
  onSelectPanel,
}: BottomNavMobileProps) {
  return (
    <nav
      className="bottom-nav-mobile"
      role="navigation"
      aria-label="ناوبری پایینی موبایل"
    >
      <div className="bottom-nav-container">
        {mobileTabs.map((tab) => {
          const isSelected = activePanel === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={`bottom-nav-item ${isSelected ? "active" : ""}`}
              onClick={() => onSelectPanel(tab.id)}
              aria-current={isSelected ? "page" : undefined}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon size={20} className="bottom-nav-icon" />
                {tab.badge ? (
                  <span className="bottom-nav-badge" aria-hidden="true" />
                ) : null}
              </div>
              <span className="bottom-nav-label">{tab.label}</span>
              {isSelected ? <span className="bottom-nav-indicator" /> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
