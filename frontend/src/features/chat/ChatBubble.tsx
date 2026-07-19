import { motion } from "framer-motion";
import type { ChatMessage } from "../../stores/sessionStore";

interface ChatBubbleProps {
  message: ChatMessage;
  onReplay?: (msg: ChatMessage) => void;
}

export function ChatBubble({ message, onReplay }: ChatBubbleProps) {
  const isChild = message.sender === "child";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        display: "flex",
        justifyContent: isChild ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: isChild ? "#EEF0FF" : "#FFF4E6",
          borderRadius: "20px",
          borderBottomRightRadius: isChild ? "6px" : "20px",
          borderBottomLeftRadius: isChild ? "20px" : "6px",
          padding: "12px 16px",
          boxShadow: "0 6px 14px rgba(99, 91, 255, 0.10)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: isChild ? "#635BFF" : "#8A5A00",
            fontFamily: "var(--font-chat)",
          }}
        >
          {isChild ? "" : "🗣️ "}
          {message.text}
        </span>
        {isChild && onReplay && (
          <button
            type="button"
            aria-label="Replay this message"
            onClick={() => onReplay(message)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "2px 4px",
            }}
          >
            🔊
          </button>
        )}
      </div>
    </motion.div>
  );
}