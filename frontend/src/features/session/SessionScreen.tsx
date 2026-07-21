import { useState } from "react";
import { motion } from "framer-motion";
import { useSessionStore } from "../../stores/sessionStore";
import { useTTS } from "../../hooks/useTTS";
import { useGridPrefetch } from "../../hooks/useGridPrefetch";
import { api } from "../../api/client";
import { WordGrid } from "../grid/WordGrid";
import { SentenceBar } from "../grid/SentenceBar";
import { GridSkeleton } from "../grid/GridSkeleton";
import { CaregiverInput } from "./CaregiverInput";
import { QuickReplies } from "./QuickReplies";
import { ChatPanel } from "../chat/ChatPanel";
import type { ChatMessage } from "../../stores/sessionStore";
import { SayAnything } from "./SayAnything";
import { newId } from "../../stores/sessionStore";
import { ClayButton } from "../../components/ui/ClayButton";
import { useEffect } from "react";
import { useSettingsStore } from "../../stores/settingsStore";
import { useSwitchScanning } from "../../hooks/useSwitchScanning";
import { useWakeLock } from "../../hooks/useWakeLock";

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function SessionScreen() {
  const {
    chatHistory,
    sessionId,
    openSummary,
    setSummary,
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
  const [sayAnythingOpen, setSayAnythingOpen] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const scanningEnabled = useSettingsStore((s) => s.scanningEnabled);
  const scanSpeedMs = useSettingsStore((s) => s.scanSpeedMs);

  useWakeLock(true);

  const { highlightedIndices, activate } = useSwitchScanning({
    enabled: scanningEnabled && !busy && !sayAnythingOpen,
    itemCount: activeGrid.length,
    columns: 4,
    speedMs: scanSpeedMs,
    onSelect: (index) => {
      const word = activeGrid[index];
      if (word) handleTapWord(word.word);
    },
  });  

  // The single switch: spacebar activates the current scan step.
  useEffect(() => {
    if (!scanningEnabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        activate();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scanningEnabled, activate]);  

  // Caregiver spoke (or typed): refresh grid + quick replies based on it.
  async function handleCaregiverText(text: string) {
    if (busy) return;
    setLastCaregiverText(text);
    addMessage({ id: newId(), sender: "caregiver", text });
    clearSentence();
    clearCache();
    setSpokenSentence("");
    setBusy(true);
    setGridLoading(true);
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
      setGridLoading(false);
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
      setGridLoading(false);
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
      learnFromExchange(res.sentence);
      await speak(res.sentence);
      clearSentence();
      resetGrid();
      clearCache();
    } catch (err) {
      console.error("Compose/speak failed:", err);
    } finally {
      setBusy(false);
      setGridLoading(false);
    }
  }

  // Tap a quick reply: speak it immediately.
  async function handleQuickReply(reply: string) {
    if (busy) return;
    setSpokenSentence(reply);
    addMessage({ id: newId(), sender: "child", text: reply });
    learnFromExchange(reply);
    await speak(reply);
  }

  async function handleReplay(msg: ChatMessage) {
    await speak(msg.text);
  }   

  // Quietly learn facts from the exchange (fire-and-forget; never blocks UI).
  function learnFromExchange(childText: string) {
    if (!childText.trim()) return;
    api
      .extractMemory({
        caregiver_text: lastCaregiverText,
        child_text: childText,
      })
      .catch((err) => console.error("Memory extraction failed:", err));
  }  

  async function handleEndSession() {
    openSummary();
    const messages = chatHistory.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));
    try {
      if (sessionId) {
        const res = await api.endSession({ session_id: sessionId, messages });
        setSummary(res.summary, res.message_count);
      } else {
        setSummary("Session ended.", messages.length);
      }
    } catch (err) {
      console.error("Failed to end session:", err);
      setSummary("Your conversation has ended.", messages.length);
    }
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
        <div className="flex items-center gap-2">
          <ClayButton
            onClick={() => useSettingsStore.getState().setScanningEnabled(!scanningEnabled)}
            ariaLabel="Toggle switch scanning"
            style={{
              padding: "10px 16px",
              fontSize: "0.9rem",
              color: scanningEnabled ? "#7B1FA2" : "#8A8AA0",
              background: scanningEnabled ? "#F3E5F5" : "var(--clay-surface)",
            }}
          >
            {scanningEnabled ? "⊙ Scanning ON" : "⊙ Scanning"}
          </ClayButton>
          <ClayButton
            onClick={handleEndSession}
            ariaLabel="End session"
            style={{ padding: "10px 18px", fontSize: "0.95rem", color: "#D32F2F" }}
          >
            End
          </ClayButton>
        </div>
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

      {/* Say Anything trigger */}
      <div className="flex justify-center">
        <ClayButton
          onClick={() => setSayAnythingOpen(true)}
          disabled={busy}
          ariaLabel="Open Say Anything to find any word"
          style={{ padding: "14px 28px", fontSize: "1.05rem", color: "#7B1FA2" }}
        >
          ➕ Say Anything
        </ClayButton>
      </div>

      {/* Say Anything panel */}
      <SayAnything
        open={sayAnythingOpen}
        caregiverText={lastCaregiverText}
        onPickWord={(word) => {
          addToken(word);
          addExcluded([word]);
        }}
        onClose={() => setSayAnythingOpen(false)}
      />

      {/* Word grid */}
      <div style={{ position: "relative" }}>
        {gridLoading ? (
          <GridSkeleton count={12} />
        ) : (
          <WordGrid
            words={activeGrid}
            onTapWord={handleTapWord}
            disabled={busy}
            highlightedIndices={highlightedIndices}
          />
        )}
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

      {/* Giant switch button for tap-anywhere activation */}
      {scanningEnabled && (
        <button
          type="button"
          onClick={activate}
          aria-label="Select"
          style={{
            width: "100%",
            minHeight: "90px",
            marginTop: "8px",
            borderRadius: "var(--clay-radius)",
            border: "none",
            background: "#7B1FA2",
            color: "white",
            fontSize: "1.6rem",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "var(--clay-shadow)",
          }}
        >
          ⊙ SELECT (or press Spacebar)
        </button>
      )}
    </div>
  );
}