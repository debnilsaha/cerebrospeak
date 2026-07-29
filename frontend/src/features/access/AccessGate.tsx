import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../api/client";
import { useSettingsStore } from "../../stores/settingsStore";
import { ClayButton } from "../../components/ui/ClayButton";

interface AccessGateProps {
  onGranted: () => void;
}

export function AccessGate({ onGranted }: AccessGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const setDemoPassword = useSettingsStore((s) => s.setDemoPassword);
  const setAccessGranted = useSettingsStore((s) => s.setAccessGranted);

  async function handleSubmit() {
    if (!password.trim() || checking) return;
    setChecking(true);
    setError("");
    try {
      const res = await api.verifyAccess(password.trim());
      if (res.valid) {
        setDemoPassword(password.trim());
        setAccessGranted(true);
        onGranted();
      } else {
        setError("That password isn't right. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please try again in a moment.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-5xl font-extrabold mb-3" style={{ color: "#635BFF" }}>
          CerebroSpeak
        </h1>
        <p className="text-lg text-gray-500">A voice for every thought.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{
          background: "var(--clay-surface)",
          borderRadius: "var(--clay-radius)",
          boxShadow: "var(--clay-shadow)",
          padding: "32px",
          maxWidth: "440px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <p style={{ color: "#2A2A3C", fontSize: "1.05rem", textAlign: "center" }}>
          This is a private demo. Please enter the access password to continue.
        </p>
        <input
          type="password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Access password"
          style={{
            border: "2px solid #EEE",
            borderRadius: "16px",
            padding: "14px 18px",
            fontSize: "1.1rem",
            outline: "none",
            fontFamily: "var(--font-chat)",
          }}
        />
        {error && (
          <p style={{ color: "#D32F2F", fontSize: "0.95rem", textAlign: "center" }}>
            {error}
          </p>
        )}
        <ClayButton
          onClick={handleSubmit}
          disabled={checking || !password.trim()}
          ariaLabel="Enter"
          style={{ fontSize: "1.2rem", padding: "16px", color: "#635BFF" }}
        >
          {checking ? "Checking…" : "Enter"}
        </ClayButton>
      </motion.div>
    </div>
  );
}