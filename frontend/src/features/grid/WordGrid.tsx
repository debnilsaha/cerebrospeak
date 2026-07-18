import { motion } from "framer-motion";
import type { PredictedWord } from "../../api/types";
import { WordCell } from "./WordCell";

interface WordGridProps {
  words: PredictedWord[];
  onTapWord: (word: string) => void;
  disabled?: boolean;
}

export function WordGrid({ words, onTapWord, disabled = false }: WordGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        width: "100%",
      }}
    >
      {words.map((word, i) => (
        <motion.div
          key={`${word.word}-${i}`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
        >
          <WordCell word={word} onTap={onTapWord} disabled={disabled} />
        </motion.div>
      ))}
    </div>
  );
}