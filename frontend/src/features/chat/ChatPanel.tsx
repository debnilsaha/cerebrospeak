import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../stores/sessionStore";
import { ChatBubble } from "./ChatBubble";

interface ChatPanelProps {
  messages: ChatMessage[];
  onReplay?: (msg: ChatMessage) => void;
}

export function ChatPanel({ messages, onReplay }: ChatPanelProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div
      style={{
        background: "var(--clay-surface)",
        borderRadius: "var(--clay-radius)",
        boxShadow: "var(--clay-shadow)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxHeight: "260px",
        overflowY: "auto",
      }}
    >
      {messages.length === 0 ? (
        <span className="text-gray-400 text-center text-lg py-6">
          Your conversation will appear here…
        </span>
      ) : (
        messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onReplay={onReplay} />
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}