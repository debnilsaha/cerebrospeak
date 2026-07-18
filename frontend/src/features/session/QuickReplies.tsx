import { motion } from "framer-motion";
import { ClayButton } from "../../components/ui/ClayButton";

interface QuickRepliesProps {
  replies: string[];
  onPick: (reply: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ replies, onPick, disabled = false }: QuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {replies.map((reply, i) => (
        <motion.div
          key={`${reply}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <ClayButton
            onClick={() => onPick(reply)}
            disabled={disabled}
            ariaLabel={`Quick reply: ${reply}`}
            style={{
              padding: "14px 22px",
              fontSize: "1.1rem",
              color: "#635BFF",
              fontWeight: 700,
            }}
          >
            {reply}
          </ClayButton>
        </motion.div>
      ))}
    </div>
  );
}