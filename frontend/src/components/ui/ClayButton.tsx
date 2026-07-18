import { motion } from "framer-motion";
import type { ReactNode, CSSProperties } from "react";

interface ClayButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
  className?: string;
}

export function ClayButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  style,
  className = "",
}: ClayButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`select-none font-extrabold ${className}`}
      style={{
        minHeight: "var(--tap-min)",
        borderRadius: "var(--clay-radius)",
        background: "var(--clay-surface)",
        boxShadow: "var(--clay-shadow)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: "#2A2A3C",
        padding: "16px 28px",
        fontFamily: "var(--font-ui)",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}