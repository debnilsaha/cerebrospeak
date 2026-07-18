import { useState } from "react";
import { ClayButton } from "../../components/ui/ClayButton";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { api } from "../../api/client";

interface CaregiverInputProps {
  onCaregiverText: (text: string) => void;
  disabled?: boolean;
}

export function CaregiverInput({ onCaregiverText, disabled = false }: CaregiverInputProps) {
  const { start, stop, recording, error } = useAudioRecorder();
  const [typed, setTyped] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  async function handleMicToggle() {
    if (recording) {
      const blob = await stop();
      if (blob) {
        setTranscribing(true);
        try {
          const res = await api.transcribe(blob);
          if (res.text.trim()) {
            onCaregiverText(res.text.trim());
          }
        } catch (err) {
          console.error("Transcription failed:", err);
        } finally {
          setTranscribing(false);
        }
      }
    } else {
      await start();
    }
  }

  function handleTypedSubmit() {
    if (typed.trim()) {
      onCaregiverText(typed.trim());
      setTyped("");
    }
  }

  return (
    <div
      className="flex items-center gap-3 w-full"
      style={{
        background: "var(--clay-surface)",
        borderRadius: "var(--clay-radius)",
        boxShadow: "var(--clay-shadow)",
        padding: "14px 18px",
      }}
    >
      <ClayButton
        onClick={handleMicToggle}
        disabled={disabled || transcribing}
        ariaLabel={recording ? "Stop recording" : "Start recording"}
        style={{
          padding: "14px 22px",
          fontSize: "1.05rem",
          color: recording ? "#D32F2F" : "#635BFF",
          background: recording ? "#FFEBEE" : "var(--clay-surface)",
        }}
      >
        {recording ? "⏹ Stop" : transcribing ? "…" : "🎤 Caregiver"}
      </ClayButton>

      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleTypedSubmit()}
        placeholder="…or type what the caregiver said"
        disabled={disabled}
        className="flex-1 outline-none"
        style={{
          border: "none",
          background: "transparent",
          fontSize: "1.05rem",
          fontFamily: "var(--font-chat)",
          color: "#2A2A3C",
        }}
      />
      <ClayButton
        onClick={handleTypedSubmit}
        disabled={disabled || !typed.trim()}
        ariaLabel="Send caregiver text"
        style={{ padding: "12px 18px", fontSize: "0.95rem", color: "#1B9E4B" }}
      >
        Send
      </ClayButton>

      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}