// Hook to synthesize text via the backend and play it as audio.

import { useCallback, useRef, useState } from "react";
import { api } from "../api/client";

export function useTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      setSpeaking(true);
      const url = await api.synthesize(text);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
    } catch (err) {
      console.error("TTS failed:", err);
      setSpeaking(false);
    }
  }, []);

  return { speak, speaking };
}