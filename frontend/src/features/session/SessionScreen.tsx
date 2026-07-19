import { useState } from "react";
import { motion } from "framer-motion";
import { useSessionStore } from "../../stores/sessionStore";
import { useTTS } from "../../hooks/useTTS";
import { useGridPrefetch } from "../../hooks/useGridPrefetch";
import { api } from "../../api/client";
import { WordGrid } from "../grid/WordGrid";
import { SentenceBar } from "../grid/SentenceBar";
import { CaregiverInput } from "./CaregiverInput";
import { QuickReplies } from "./QuickReplies";
import { ChatPanel } from "../chat/ChatPanel";
import type { ChatMessage } from "../../stores/sessionStore";
import { newId } from "../../stores/sessionStore";
import { ClayButton } from "../../components/ui/ClayButton";

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function SessionScreen({ onEnd }: { onEnd: () => void }) {
  const {
    chatHistory,
    addMessage,
    activeGrid,
    sentenceTokens,
    excludedWords,
    lastCaregiverText,
    quickReplies,
    busy,
    addToken,
    setActiveGrid,
    clearSentence,
    addExcluded,
    resetGrid,
    setBusy,
    setLastCaregiverText,
    setQuickReplies,
  } = useSessionStore();

  const { speak, speaking } = useTTS();
  const { prefetch, getCached, clearCache } = useGridPrefetch();
  const [spokenSentence, setSpokenSentence] = useState("");

  // Caregiver spoke (or typed): refresh grid + quick replies based on it.
  async function handleCaregiverText(text: string) {
    if (busy) return;
    setLastCaregiverText(text);
    addMessage({ id: newId(), sender: "caregiver", text });
    clearSentence();
    clearCache();
    setSpokenSentence("");
    setBusy(true);
    try {
      const [gridRes, repliesRes] = await Promise.all([
        api.predictGrid({
          current_tokens: [],
          caregiver_utterance: text,
          exclude_words: [],
          time_of_day: timeOfDay(),
          grid_size: 12,
        }),
        api.quickReplies({ caregiver_utterance: text }),
      ]);
      setActiveGrid(gridRes.symbols);
      setQuickReplies(repliesRes.replies);

      // Speculatively prefetch the grid for the top-ranked word.
      const top = gridRes.symbols[0];
      if (top) {
        prefetch([], top.word, text, [], timeOfDay(), 12);
      }
    } catch (err) {
      console.error("Caregiver-driven prediction failed:", err);
    } finally {
      setBusy(false);
    }
  }

  // Tap a word: add to sentence, fetch next grid (instant if prefetched).
  async function handleTapWord(word: string) {
    if (busy) return;
    const nextTokens = [...sentenceTokens, word];
    addToken(word);
    addExcluded([word]);

    // Cache hit? Use the prefetched grid instantly — no spinner, no wait.
    const cached = getCached(nextTokens, lastCaregiverText);
    if (cached) {
      setActiveGrid(cached.symbols);
      const top = cached.symbols[0];
      if (top) {
        prefetch(nextTokens, top.word, lastCaregiverText, [...excludedWords, word], timeOfDay(), 12);
      }
      return;
    }

    // Cache miss: fetch normally.
    setBusy(true);
    try {
      const res = await api.predictGrid({
        current_tokens: nextTokens,
        caregiver_utterance: lastCaregiverText,
        exclude_words: [...excludedWords, word],
        time_of_day: timeOfDay(),
        grid_size: 12,
      });
      setActiveGrid(res.symbols);
      const top = res.symbols[0];
      if (top) {
        prefetch(nextTokens, top.word, lastCaregiverText, [...excludedWords, word], timeOfDay(), 12);
      }
    } catch (err) {
      console.error("Grid prediction failed:", err);
    } finally {
      setBusy(false);
    }
  }

  // Speak the built sentence.
  async function handleSpeak() {
    if (sentenceTokens.length === 0 || busy) return;
    setBusy(true);
    try {
      const res = await api.composeSentence({
        tokens: sentenceTokens,
        caregiver_utterance: lastCaregiverText,
      });
      setSpokenSentence(res.sentence);
      addMessage({ id: newId(), sender: "child", text: res.sentence });
      await speak(res.sentence);
      clearSentence();
      resetGrid();
      clearCache();
    } catch (err) {
      console.error("Compose/speak failed:", err);
    } finally {
      setBusy(false);
    }
  }

  // Tap a quick reply: speak it immediately.
  async function handleQuickReply(reply: string) {
    if (busy) return;
    setSpokenSentence(reply);
    addMessage({ id: newId(), sender: "child", text: reply });
    await speak(reply);
  }

  async function handleReplay(msg: ChatMessage) {
    await speak(msg.text);
  }   

  function handleClear() {
    clearSentence();
    resetGrid();
    clearCache();
    setSpokenSentence("");
  }

  return (
    <div className="min-h-screen flex flex-col gap-4 p-6 max-w-5xl mx-auto">
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

      {/* Chat history */}
      <ChatPanel messages={chatHistory} onReplay={handleReplay} />

      {/* Caregiver input */}
      <CaregiverInput onCaregiverText={handleCaregiverText} disabled={busy} />

      {/* Last caregiver utterance */}
      {lastCaregiverText && (
        <div
          style={{
            background: "#FFF4E6",
            borderRadius: "18px",
            padding: "10px 18px",
            fontSize: "1.05rem",
            color: "#8A5A00",
          }}
        >
          🗣️ {lastCaregiverText}
        </div>
      )}

      {/* Quick replies */}
      <QuickReplies replies={quickReplies} onPick={handleQuickReply} disabled={busy} />

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