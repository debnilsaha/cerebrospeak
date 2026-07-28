import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../api/client";
import type { SessionRecord, MemoryFacts } from "../../api/types";
import { ClayButton } from "../../components/ui/ClayButton";

function cleanSummary(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")      // remove bold markers
    .replace(/^#+\s*/gm, "")   // remove markdown headings
    .replace(/^\s*Session Summary\s*/i, "") // drop a leading "Session Summary" label
    .trim();
}

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [memory, setMemory] = useState<MemoryFacts>({ permanent: {}, temporary: {} });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([api.listSessions(), api.getMemory()]);
      setSessions(s);
      setMemory(m);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeleteFact(key: string) {
    try {
      await api.deleteMemoryFact(key);
      await load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const memoryEntries = [
    ...Object.entries(memory.permanent).map(([k, v]) => ({ key: k, value: v, type: "permanent" as const })),
    ...Object.entries(memory.temporary).map(([k, v]) => ({ key: k, value: v, type: "temporary" as const })),
  ];

  return (
    <div className="min-h-screen flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold" style={{ color: "#635BFF" }}>
          Caregiver Dashboard
        </h1>
        <ClayButton onClick={onBack} ariaLabel="Back to home" style={{ padding: "10px 20px", color: "#635BFF" }}>
          ← Back
        </ClayButton>
      </div>

      {loading ? (
        <p className="text-gray-400 text-lg text-center py-10">Loading…</p>
      ) : (
        <>
          {/* Memory section */}
          <section
            style={{
              background: "var(--clay-surface)",
              borderRadius: "var(--clay-radius)",
              boxShadow: "var(--clay-shadow)",
              padding: "24px",
            }}
          >
            <h2 className="text-xl font-extrabold mb-4" style={{ color: "#7B1FA2" }}>
              🧠 What CerebroSpeak has learned
            </h2>
            {memoryEntries.length === 0 ? (
              <p className="text-gray-400">Nothing learned yet — it will fill in as you chat.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {memoryEntries.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center justify-between"
                    style={{
                      background: f.type === "permanent" ? "#EEF0FF" : "#FFF4E6",
                      borderRadius: "14px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ fontSize: "1.05rem", color: "#2A2A3C" }}>
                      <strong>{f.key.replace(/_/g, " ")}:</strong> {f.value}
                      {f.type === "temporary" && (
                        <span style={{ color: "#8A5A00", fontSize: "0.85rem" }}> (temporary)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete ${f.key}`}
                      onClick={() => handleDeleteFact(f.key)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#D32F2F",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sessions section */}
          <section
            style={{
              background: "var(--clay-surface)",
              borderRadius: "var(--clay-radius)",
              boxShadow: "var(--clay-shadow)",
              padding: "24px",
            }}
          >
            <h2 className="text-xl font-extrabold mb-4" style={{ color: "#1B9E4B" }}>
              📖 Past conversations
            </h2>
            {sessions.length === 0 ? (
              <p className="text-gray-400">No past sessions yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      borderRadius: "16px",
                      border: "1px solid #EEE",
                      padding: "16px",
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontWeight: 700, color: "#635BFF" }}>
                        {s.started_at ? new Date(s.started_at).toLocaleString() : "Session"}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "#8A8AA0" }}>
                        {s.message_count} messages
                      </span>
                    </div>
                    <p style={{ color: "#2A2A3C", lineHeight: 1.5, fontFamily: "var(--font-chat)" }}>
                      {cleanSummary(s.summary)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}