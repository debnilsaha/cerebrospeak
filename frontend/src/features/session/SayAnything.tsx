import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api/client";
import type { PredictedWord } from "../../api/types";
import { WordGrid } from "../grid/WordGrid";
import { ClayButton } from "../../components/ui/ClayButton";

interface SayAnythingProps {
  open: boolean;
  caregiverText: string;
  onPickWord: (word: string) => void;
  onClose: () => void;
}

export function SayAnything({ open, caregiverText, onPickWord, onClose }: SayAnythingProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PredictedWord[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.findWords({
        query: query.trim(),
        caregiver_utterance: caregiverText,
        grid_size: 12,
      });
      setResults(res.symbols);
    } catch (err) {
      console.error("Word finder failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // Direct text entry — the guaranteed floor. Speaks exactly what's typed.
  function handleUseExact() {
    if (query.trim()) {
      onPickWord(query.trim());
      reset();
    }
  }

  function handlePick(word: string) {
    onPickWord(word);
    reset();
  }

  function reset() {
    setQuery("");
    setResults([]);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={reset}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(42, 42, 60, 0.35)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              borderRadius: "var(--clay-radius)",
              boxShadow: "var(--clay-shadow)",
              padding: "24px",
              width: "100%",
              maxWidth: "720px",
              maxHeight: "88vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold" style={{ color: "#635BFF" }}>
                ➕ Say Anything
              </h2>
              <ClayButton
                onClick={reset}
                ariaLabel="Close"
                style={{ padding: "10px 16px", fontSize: "0.95rem", color: "#D32F2F" }}
              >
                Close
              </ClayButton>
            </div>

            {/* Search / type box */}
            <div
              className="flex items-center gap-3"
              style={{
                background: "var(--clay-surface)",
                borderRadius: "var(--clay-radius)",
                boxShadow: "var(--clay-shadow)",
                padding: "14px 18px",
              }}
            >
              <input
                type="text"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Type a word or topic (e.g. dinosaur, space)…"
                className="flex-1 outline-none"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.15rem",
                  fontFamily: "var(--font-chat)",
                  color: "#2A2A3C",
                }}
              />
              <ClayButton
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                ariaLabel="Find words"
                style={{ padding: "12px 20px", fontSize: "1rem", color: "#635BFF" }}
              >
                {loading ? "…" : "🔍 Find"}
              </ClayButton>
              <ClayButton
                onClick={handleUseExact}
                disabled={!query.trim()}
                ariaLabel="Say exactly this"
                style={{ padding: "12px 20px", fontSize: "1rem", color: "#1B9E4B" }}
              >
                Use “{query.trim() || "…"}”
              </ClayButton>
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <WordGrid words={results} onTapWord={handlePick} disabled={loading} />
            ) : (
              <p className="text-gray-400 text-center py-4">
                Search for any word, or tap “Use” to say exactly what you typed.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}