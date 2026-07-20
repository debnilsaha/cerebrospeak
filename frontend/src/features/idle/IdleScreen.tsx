import { motion } from "framer-motion";
import { ClayButton } from "../../components/ui/ClayButton";

interface IdleScreenProps {
  onStart: () => void;
  onOpenDashboard: () => void;
}

export function IdleScreen({ onStart, onOpenDashboard }: IdleScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1
          className="text-5xl font-extrabold mb-3"
          style={{ color: "#635BFF" }}
        >
          CerebroSpeak
        </h1>
        <p className="text-xl text-gray-500">
          A voice for every thought.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ClayButton
          onClick={onStart}
          ariaLabel="Start a new conversation"
          style={{
            fontSize: "1.6rem",
            padding: "32px 56px",
            color: "#635BFF",
          }}
        >
          💬 Start Conversation
        </ClayButton>
      </motion.div>
      <motion.button
        type="button"
        onClick={onOpenDashboard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        aria-label="Open caregiver dashboard"
        style={{
          border: "none",
          background: "transparent",
          color: "#8A8AA0",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        📊 Caregiver Dashboard
      </motion.button>      
    </div>
  );
}