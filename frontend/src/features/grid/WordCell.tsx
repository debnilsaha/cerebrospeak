import { motion } from "framer-motion";
import type { PredictedWord, WordCategory } from "../../api/types";

// Map each Fitzgerald category to its CSS color variable.
const CATEGORY_COLOR: Record<WordCategory, string> = {
  pronoun: "var(--fk-pronoun)",
  verb: "var(--fk-verb)",
  noun: "var(--fk-noun)",
  adjective: "var(--fk-adjective)",
  social: "var(--fk-social)",
  question: "var(--fk-question)",
  urgent: "var(--fk-urgent)",
};

interface WordCellProps {
  word: PredictedWord;
  onTap: (word: string) => void;
  disabled?: boolean;
  highlighted?: boolean;
}

export function WordCell({ word, onTap, disabled = false, highlighted = false }: WordCellProps) {
  const ringColor = CATEGORY_COLOR[word.category] ?? "var(--fk-social)";
  const isUrgent = word.urgent;

  return (
    <motion.button
      type="button"
      aria-label={`${word.word}, ${word.category}${isUrgent ? ", urgent" : ""}`}
      disabled={disabled}
      onClick={() => onTap(word.word)}
      whileTap={{ scale: 0.94 }}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      animate={
        isUrgent
          ? { boxShadow: [
              "var(--clay-shadow)",
              "0 0 0 4px rgba(211,47,47,0.35), var(--clay-shadow)",
              "var(--clay-shadow)",
            ] }
          : undefined
      }
      transition={
        isUrgent
          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
          : { type: "spring", stiffness: 400, damping: 22 }
      }
      className="flex items-center justify-center select-none"
      style={{
        minHeight: "var(--tap-min)",
        borderRadius: "var(--clay-radius)",
        background: isUrgent ? "#FFEBEE" : "var(--clay-surface)",
        boxShadow: highlighted
          ? "0 0 0 6px rgba(123, 31, 162, 0.55), var(--clay-shadow)"
          : "var(--clay-shadow)",
        border: `5px solid ${ringColor}`,
        outline: highlighted ? "3px solid #7B1FA2" : "none",
        outlineOffset: highlighted ? "2px" : "0",
        transform: highlighted ? "scale(1.05)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: "12px",
        fontFamily: "var(--font-ui)",
        fontWeight: 800,
        fontSize: "1.25rem",
        color: "#2A2A3C",
      }}
    >
      {word.word}
    </motion.button>
  );
}