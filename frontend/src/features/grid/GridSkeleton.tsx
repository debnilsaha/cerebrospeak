import { motion } from "framer-motion";

interface GridSkeletonProps {
  count?: number;
}

export function GridSkeleton({ count = 12 }: GridSkeletonProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        width: "100%",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
          style={{
            minHeight: "var(--tap-min)",
            borderRadius: "var(--clay-radius)",
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-shadow)",
          }}
        />
      ))}
    </div>
  );
}