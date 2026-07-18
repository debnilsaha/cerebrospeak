import { useState } from "react";
import { motion } from "framer-motion";
import { useSessionStore } from "../../stores/sessionStore";
import { useTTS } from "../../hooks/useTTS";
import { api } from "../../api/client";
import { WordGrid } from "../grid/WordGrid";
import { SentenceBar } from "../grid/SentenceBar";
import { ClayButton } from "../../components/ui/ClayButton";

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function SessionScreen({ onEnd }: { onEnd: () => void }) {
  const {
    activeGrid,
    sentenceTokens,
    excludedWords,
    lastCaregiverText,
    busy,
    addToken,
    setActiveGrid,
    clearSentence,
    addExcluded,
    setBusy,
  } = useSessionStore();

  const { speak, speaking } = useTTS();
  const [spokenSentence, setSpokenSentence] = useState("");

  // Tap a word: add it to the sentence, then fetch the next grid.
  async function handleTapWord(word: string) {
    if (busy) return;
    addToken(word);
    addExcluded([word]);
    setBusy(true);
    try {
      const nextTokens = [...sentenceTokens, word];
      const res = await api.predictGrid({
        current_tokens: nextTokens,
        caregiver_utterance: lastCaregiverText,
        exclude_words: [...excludedWords, word],
        time_of_day: timeOfDay(),
        grid_size: 12,
      });
      setActiveGrid(res.symbols);
    } catch (err) {
      console.error("Grid prediction failed:", err);
    } finally {
      setBusy(false);
    }
  }

  // Speak: compose the tapped tokens into a sentence and speak it.
  async function handleSpeak() {
    if (sentenceTokens.length === 0 || busy) return;
    setBusy(true);
    try {
      const res = await api.composeSentence({
        tokens: sentenceTokens,
        caregiver_utterance: lastCaregiverText,
      });
      setSpokenSentence(res.sentence);
      await speak(res.sentence);
    } catch (err) {
      console.error("Compose/speak failed:", err);
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    clearSentence();
    setSpokenSentence("");
  }

  return (
    <div className="min-h-screen flex flex-col gap-5 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold" style={{ color: "#635BFF" }}>
          CerebroSpeak
        </h1>
        <ClayButton
          onClick={onEnd}
          ariaLabel="End session"
          style={{ padding: "10px 18px", fontSize: "0.95rem", color: "#D32F2F" }}
        >
          End
        </ClayButton>
      </div>

      {/* Spoken sentence banner */}
      {spokenSentence && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#EEF0FF",
            borderRadius: "var(--clay-radius)",
            padding: "14px 20px",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "#635BFF",
          }}
        >
          {speaking ? "🔊 " : "💬 "}
          {spokenSentence}
        </motion.div>
      )}

      {/* Sentence bar */}
      <SentenceBar
        tokens={sentenceTokens}
        onClear={handleClear}
        onSpeak={handleSpeak}
        disabled={busy}
      />

      {/* Word grid */}
      <div style={{ position: "relative" }}>
        <WordGrid words={activeGrid} onTapWord={handleTapWord} disabled={busy} />
        {busy && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: "0.9rem",
              color: "#635BFF",
              fontWeight: 700,
            }}
          >
            thinking…
          </div>
        )}
      </div>
    </div>
  );
}