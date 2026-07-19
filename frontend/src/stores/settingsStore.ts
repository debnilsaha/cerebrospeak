// Settings store (Zustand): accessibility and preference options.

import { create } from "zustand";

interface SettingsState {
  // Switch scanning
  scanningEnabled: boolean;
  scanSpeedMs: number; // dwell time per step

  setScanningEnabled: (on: boolean) => void;
  setScanSpeedMs: (ms: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  scanningEnabled: false,
  scanSpeedMs: 1200,

  setScanningEnabled: (on) => set({ scanningEnabled: on }),
  setScanSpeedMs: (ms) => set({ scanSpeedMs: ms }),
}));