import { useSessionStore } from "./stores/sessionStore";
import { IdleScreen } from "./features/idle/IdleScreen";
import { SessionScreen } from "./features/session/SessionScreen";
import { SessionSummary } from "./features/summary/SessionSummary";
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

  async function handleStart() {
    startSession();
    // Create the backend session (non-blocking for the UI).
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

  if (!chatActive) {
    return <IdleScreen onStart={handleStart} />;
  }

  return <SessionScreen />;
}

export default App;