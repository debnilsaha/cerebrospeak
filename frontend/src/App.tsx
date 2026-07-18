import { useSessionStore } from "./stores/sessionStore";
import { IdleScreen } from "./features/idle/IdleScreen";
import { SessionScreen } from "./features/session/SessionScreen";

function App() {
  const chatActive = useSessionStore((s) => s.chatActive);
  const startSession = useSessionStore((s) => s.startSession);
  const endSession = useSessionStore((s) => s.endSession);

  if (!chatActive) {
    return <IdleScreen onStart={startSession} />;
  }

  return <SessionScreen onEnd={endSession} />;
}

export default App;