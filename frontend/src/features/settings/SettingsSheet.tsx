import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../../stores/settingsStore";
import { ClayButton } from "../../components/ui/ClayButton";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const scanningEnabled = useSettingsStore((s) => s.scanningEnabled);
  const scanSpeedMs = useSettingsStore((s) => s.scanSpeedMs);
  const setScanningEnabled = useSettingsStore((s) => s.setScanningEnabled);
  const setScanSpeedMs = useSettingsStore((s) => s.setScanSpeedMs);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(42, 42, 60, 0.35)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              borderRadius: "var(--clay-radius)",
              boxShadow: "var(--clay-shadow)",
              padding: "28px",
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold" style={{ color: "#635BFF" }}>
                ⚙️ Settings
              </h2>
              <ClayButton
                onClick={onClose}
                ariaLabel="Close settings"
                style={{ padding: "10px 16px", fontSize: "0.95rem", color: "#635BFF" }}
              >
                Done
              </ClayButton>
            </div>

            {/* Switch scanning toggle */}
            <div
              className="flex items-center justify-between"
              style={{
                background: "var(--clay-surface)",
                borderRadius: "18px",
                padding: "16px 20px",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#2A2A3C" }}>
                  Switch Scanning
                </div>
                <div style={{ fontSize: "0.9rem", color: "#8A8AA0" }}>
                  Select words with a single switch (Spacebar)
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={scanningEnabled}
                aria-label="Toggle switch scanning"
                onClick={() => setScanningEnabled(!scanningEnabled)}
                style={{
                  width: "60px",
                  height: "34px",
                  borderRadius: "17px",
                  border: "none",
                  cursor: "pointer",
                  background: scanningEnabled ? "#7B1FA2" : "#CCC",
                  position: "relative",
                  transition: "background 180ms",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: scanningEnabled ? "29px" : "3px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 180ms",
                  }}
                />
              </button>
            </div>

            {/* Scan speed slider — only relevant when scanning is on */}
            <div
              style={{
                background: "var(--clay-surface)",
                borderRadius: "18px",
                padding: "16px 20px",
                opacity: scanningEnabled ? 1 : 0.5,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#2A2A3C" }}>
                  Scan Speed
                </span>
                <span style={{ fontWeight: 700, color: "#7B1FA2" }}>
                  {(scanSpeedMs / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={600}
                max={2500}
                step={100}
                value={scanSpeedMs}
                disabled={!scanningEnabled}
                onChange={(e) => setScanSpeedMs(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#7B1FA2", cursor: "pointer" }}
              />
              <div className="flex justify-between" style={{ fontSize: "0.8rem", color: "#8A8AA0" }}>
                <span>Faster (0.6s)</span>
                <span>Slower (2.5s)</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}