import { useState } from "react";
import { useSessionStore } from "./stores/sessionStore";
import { IdleScreen } from "./features/idle/IdleScreen";
import { SessionScreen } from "./features/session/SessionScreen";
import { SessionSummary } from "./features/summary/SessionSummary";
import { Dashboard } from "./features/dashboard/Dashboard";
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

  const [showDashboard, setShowDashboard] = useState(false);

  async function handleStart() {
    startSession();
    try {
      const res = await api.startSession();
      setSessionId(res.session_id);
    } catch (err) {
      console.error("Failed to start backend session:", err);
    }
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