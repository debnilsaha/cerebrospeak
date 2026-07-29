// Settings store (Zustand): accessibility and preference options.

import { create } from "zustand";

interface SettingsState {
  // Switch scanning
  scanningEnabled: boolean;
  scanSpeedMs: number; // dwell time per step

  // Demo access
  demoPassword: string;
  accessGranted: boolean;

  setScanningEnabled: (on: boolean) => void;
  setScanSpeedMs: (ms: number) => void;
  setDemoPassword: (pw: string) => void;
  setAccessGranted: (granted: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  scanningEnabled: false,
  scanSpeedMs: 1200,
  demoPassword: "",
  accessGranted: false,

  setScanningEnabled: (on) => set({ scanningEnabled: on }),
  setScanSpeedMs: (ms) => set({ scanSpeedMs: ms }),
  setDemoPassword: (pw) => set({ demoPassword: pw }),
  setAccessGranted: (granted) => set({ accessGranted: granted }),
}));