"use client";

import { useEffect, useState, useCallback } from "react";
import {
  observeCloudSession,
  signInToCloudControl,
  signOutFromCloudControl,
  type CloudSession,
} from "./firebase-client";
import type { PanelId } from "./components/types";
import { SidebarNav } from "./components/SidebarNav";
import { HeaderTopbar } from "./components/HeaderTopbar";
import { SystemMetricsBar } from "./components/SystemMetricsBar";
import { SafetyBanner } from "./components/SafetyBanner";
import { GoldenEvidenceCard } from "./components/GoldenEvidenceCard";
import { HistoricalReplayCard } from "./components/HistoricalReplayCard";
import { OfflineAiBenchmarkCard } from "./components/OfflineAiBenchmarkCard";
import { AdvisoryCouncilCard } from "./components/AdvisoryCouncilCard";
import { DevicesPanel } from "./components/DevicesPanel";
import { AuditLogPanel } from "./components/AuditLogPanel";
import { CloudControlCard } from "./components/CloudControlCard";
import { SystemInvariantsCard } from "./components/SystemInvariantsCard";
import { BottomNavMobile } from "./components/BottomNavMobile";

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<PanelId>("overview");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [cloudSession, setCloudSession] = useState<CloudSession>({
    kind: "not-configured",
  });
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => {
    return observeCloudSession(setCloudSession);
  }, []);

  const handleSelectPanel = useCallback((panel: PanelId) => {
    setActivePanel(panel);
    setMobileNavigationOpen(false);
  }, []);

  // Windows desktop keyboard navigation (Alt + 1..6)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
          case "1":
            event.preventDefault();
            handleSelectPanel("overview");
            break;
          case "2":
            event.preventDefault();
            handleSelectPanel("replay");
            break;
          case "3":
            event.preventDefault();
            handleSelectPanel("golden");
            break;
          case "4":
            event.preventDefault();
            handleSelectPanel("council");
            break;
          case "5":
            event.preventDefault();
            handleSelectPanel("devices");
            break;
          case "6":
            event.preventDefault();
            handleSelectPanel("audit");
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectPanel]);

  async function handleCloudSignIn() {
    setCloudBusy(true);
    const session = await signInToCloudControl();
    if (session !== null) {
      setCloudSession(session);
    }
    setCloudBusy(false);
  }

  async function handleCloudSignOut() {
    setCloudBusy(true);
    await signOutFromCloudControl();
    setCloudBusy(false);
  }

  return (
    <main className="app-shell">
      <SidebarNav
        activePanel={activePanel}
        onSelectPanel={handleSelectPanel}
        isOpenMobile={mobileNavigationOpen}
        onCloseMobile={() => setMobileNavigationOpen(false)}
      />

      <section className="workspace">
        <HeaderTopbar
          activePanel={activePanel}
          onOpenMobileNav={() => setMobileNavigationOpen(true)}
          notificationEnabled={notificationEnabled}
          onToggleNotification={() => setNotificationEnabled((v) => !v)}
        />

        <div className="content-grid">
          <section className="primary-column">
            <SystemMetricsBar />
            <SafetyBanner />

            {activePanel === "overview" && (
              <>
                <GoldenEvidenceCard />
                <HistoricalReplayCard showTable={false} />
                <AdvisoryCouncilCard />
                <OfflineAiBenchmarkCard />
              </>
            )}

            {activePanel === "replay" && (
              <HistoricalReplayCard showTable={true} />
            )}

            {activePanel === "golden" && (
              <>
                <GoldenEvidenceCard />
                <HistoricalReplayCard showTable={true} />
              </>
            )}

            {activePanel === "council" && (
              <>
                <AdvisoryCouncilCard />
                <OfflineAiBenchmarkCard />
              </>
            )}

            {activePanel === "devices" && <DevicesPanel />}

            {activePanel === "audit" && <AuditLogPanel />}
          </section>

          <aside className="secondary-column">
            <CloudControlCard
              cloudSession={cloudSession}
              cloudBusy={cloudBusy}
              onSignIn={handleCloudSignIn}
              onSignOut={handleCloudSignOut}
            />

            <SystemInvariantsCard />
          </aside>
        </div>
      </section>

      <BottomNavMobile
        activePanel={activePanel}
        onSelectPanel={handleSelectPanel}
      />
    </main>
  );
}
