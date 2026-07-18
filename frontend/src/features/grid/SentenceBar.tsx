import { motion, AnimatePresence } from "framer-motion";
import { ClayButton } from "../../components/ui/ClayButton";

interface SentenceBarProps {
  tokens: string[];
  onClear: () => void;
  onSpeak: () => void;
  disabled?: boolean;
}

export function SentenceBar({ tokens, onClear, onSpeak, disabled = false }: SentenceBarProps) {
  return (
    <div
      className="flex items-center gap-3 w-full"
      style={{
        background: "var(--clay-surface)",
        borderRadius: "var(--clay-radius)",
        boxShadow: "var(--clay-shadow)",
        padding: "16px 20px",
        minHeight: "84px",
      }}
    >
      <div className="flex-1 flex flex-wrap gap-2 items-center">
        <AnimatePresence>
          {tokens.length === 0 ? (
            <span className="text-gray-400 text-lg">Tap words to build a sentence…</span>
          ) : (
            tokens.map((t, i) => (
              <motion.span
                key={`${t}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: "#EEF0FF",
                  borderRadius: "14px",
                  padding: "6px 14px",
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  color: "#635BFF",
                }}
              >
                {t}
              </motion.span>
            ))
          )}
        </AnimatePresence>
      </div>

      <ClayButton
        onClick={onClear}
        disabled={disabled || tokens.length === 0}
        ariaLabel="Clear sentence"
        style={{ padding: "12px 18px", fontSize: "1rem", color: "#D32F2F" }}
      >
        Clear
      </ClayButton>
      <ClayButton
        onClick={onSpeak}
        disabled={disabled || tokens.length === 0}
        ariaLabel="Speak sentence"
        style={{ padding: "12px 22px", fontSize: "1rem", color: "#1B9E4B" }}
      >
        🔊 Speak
      </ClayButton>
    </div>
  );
}