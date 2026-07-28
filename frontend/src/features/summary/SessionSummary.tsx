import { motion } from "framer-motion";
import { ClayButton } from "../../components/ui/ClayButton";

function cleanSummary(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")      // remove bold markers
    .replace(/^#+\s*/gm, "")   // remove markdown headings
    .replace(/^\s*Session Summary\s*/i, "") // drop a leading "Session Summary" label
    .trim();
}

interface SessionSummaryProps {
  summary: string;
  messageCount: number;
  loading: boolean;
  onDone: () => void;
}

export function SessionSummary({ summary, messageCount, loading, onDone }: SessionSummaryProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#635BFF" }}>
          Session Complete
        </h1>
        <p className="text-lg text-gray-500">
          {messageCount} {messageCount === 1 ? "message" : "messages"} exchanged
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{
          background: "var(--clay-surface)",
          borderRadius: "var(--clay-radius)",
          boxShadow: "var(--clay-shadow)",
          padding: "32px",
          maxWidth: "620px",
          width: "100%",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: "1.5rem" }}>📝</span>
          <h2 className="text-xl font-extrabold" style={{ color: "#7B1FA2" }}>
            Summary for you
          </h2>
        </div>
        {loading ? (
          <p className="text-gray-400 text-lg">Writing your summary…</p>
        ) : (
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.6,
              color: "#2A2A3C",
              fontFamily: "var(--font-chat)",
            }}
          >
            {cleanSummary(summary)}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ClayButton
          onClick={onDone}
          disabled={loading}
          ariaLabel="Return to home"
          style={{ fontSize: "1.3rem", padding: "20px 44px", color: "#635BFF" }}
        >
          🏠 Done
        </ClayButton>
      </motion.div>
    </div>
  );
}