import { motion } from "framer-motion";
import { ClayButton } from "../../components/ui/ClayButton";

interface IdleScreenProps {
  onStart: () => void;
}

export function IdleScreen({ onStart }: IdleScreenProps) {
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
    </div>
  );
}