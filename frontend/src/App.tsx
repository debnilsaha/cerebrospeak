import { useEffect, useState } from "react";
import { useSessionStore } from "./stores/sessionStore";
import { useSettingsStore } from "./stores/settingsStore";
import { IdleScreen } from "./features/idle/IdleScreen";
import { SessionScreen } from "./features/session/SessionScreen";
import { SessionSummary } from "./features/summary/SessionSummary";
import { Dashboard } from "./features/dashboard/Dashboard";
import { AccessGate } from "./features/access/AccessGate";
import { api } from "./api/client";

function App() {
  const chatActive = useSessionStore((s) => s.chatActive);
  const showSummary = useSessionStore((s) => s.showSummary);
  const summaryText = useSessionStore((s) => s.summaryText);
  const summaryCount = useSessionStore((s) => s.summaryCount);
  const summaryLoading = useSessionStore((s) => s.summaryLoading);
  const startSession = useSessionStore((s) => s.startSession);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const closeSummary = useSessionStore((s) => s.closeSummary);

  const accessGranted = useSettingsStore((s) => s.accessGranted);
  const setAccessGranted = useSettingsStore((s) => s.setAccessGranted);

  const [showDashboard, setShowDashboard] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  // On load, check whether the demo gate is enabled. If not, grant access.
  useEffect(() => {
    api
      .verifyAccess("")
      .then((res) => {
        if (!res.gate_enabled) {
          setAccessGranted(true);
        }
      })
      .catch(() => {
        // If the check fails, still show the gate (safer default).
      })
      .finally(() => setGateChecked(true));
  }, [setAccessGranted]);

  async function handleStart() {
    startSession();
    try {
      const res = await api.startSession();
      setSessionId(res.session_id);
    } catch (err) {
      console.error("Failed to start backend session:", err);
    }
  }

  // Wait until we know whether the gate is on.
  if (!gateChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading…</p>
      </div>
    );
  }

  // Gate enabled and not yet passed → show access screen.
  if (!accessGranted) {
    return <AccessGate onGranted={() => setAccessGranted(true)} />;
  }

  if (showSummary) {
    return (
      <SessionSummary
        summary={summaryText}
        messageCount={summaryCount}
        loading={summaryLoading}
        onDone={closeSummary}
      />
    );
  }

  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />;
  }

  if (!chatActive) {
    return (
      <IdleScreen onStart={handleStart} onOpenDashboard={() => setShowDashboard(true)} />
    );
  }

  return <SessionScreen />;
}

export default App;