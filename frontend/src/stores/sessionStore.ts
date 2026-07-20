// Session state store (Zustand): chat, sentence building, and the active grid.

import { create } from "zustand";
import type { PredictedWord } from "../api/types";

export interface ChatMessage {
  id: string;
  sender: "caregiver" | "child";
  text: string;
  audioUrl?: string;
}

// Core vocabulary shown at session start and as a safe fallback.
export const CORE_VOCABULARY: PredictedWord[] = [
  { word: "I", category: "pronoun", urgent: false, rank: 1, reason: "" },
  { word: "want", category: "verb", urgent: false, rank: 2, reason: "" },
  { word: "yes", category: "social", urgent: false, rank: 3, reason: "" },
  { word: "no", category: "social", urgent: false, rank: 4, reason: "" },
  { word: "more", category: "adjective", urgent: false, rank: 5, reason: "" },
  { word: "stop", category: "verb", urgent: true, rank: 6, reason: "" },
  { word: "help", category: "urgent", urgent: true, rank: 7, reason: "" },
  { word: "eat", category: "verb", urgent: false, rank: 8, reason: "" },
  { word: "drink", category: "verb", urgent: false, rank: 9, reason: "" },
  { word: "go", category: "verb", urgent: false, rank: 10, reason: "" },
  { word: "like", category: "verb", urgent: false, rank: 11, reason: "" },
];

interface SessionState {
  // Status
  chatActive: boolean;
  busy: boolean;
  sessionId: string | null;
  showSummary: boolean;
  summaryText: string;
  summaryCount: number;
  summaryLoading: boolean;

  // Conversation
  chatHistory: ChatMessage[];
  lastCaregiverText: string;
  quickReplies: string[];

  // Sentence building
  sentenceTokens: string[];
  activeGrid: PredictedWord[];
  excludedWords: string[];

  // Actions
  startSession: () => void;
  endSession: () => void;
  setSessionId: (id: string | null) => void;
  openSummary: () => void;
  setSummary: (text: string, count: number) => void;
  closeSummary: () => void;
  setBusy: (busy: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  setLastCaregiverText: (text: string) => void;
  setQuickReplies: (replies: string[]) => void;
  setActiveGrid: (grid: PredictedWord[]) => void;
  addToken: (word: string) => void;
  clearSentence: () => void;
  addExcluded: (words: string[]) => void;
  resetGrid: () => void;
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useSessionStore = create<SessionState>((set) => ({
  chatActive: false,
  busy: false,
  sessionId: null,
  showSummary: false,
  summaryText: "",
  summaryCount: 0,
  summaryLoading: false,
  chatHistory: [],
  lastCaregiverText: "",
  quickReplies: [],
  sentenceTokens: [],
  activeGrid: CORE_VOCABULARY,
  excludedWords: [],

  startSession: () =>
    set({
      chatActive: true,
      chatHistory: [],
      quickReplies: [],
      sentenceTokens: [],
      activeGrid: CORE_VOCABULARY,
      excludedWords: [],
    }),

  endSession: () =>
    set({
      chatActive: false,
      chatHistory: [],
      quickReplies: [],
      sentenceTokens: [],
      activeGrid: CORE_VOCABULARY,
      excludedWords: [],
      lastCaregiverText: "",
    }),

  setBusy: (busy) => set({ busy }),
  setSessionId: (id) => set({ sessionId: id }),

  openSummary: () => set({ showSummary: true, summaryLoading: true }),
  setSummary: (text, count) =>
    set({ summaryText: text, summaryCount: count, summaryLoading: false }),
  closeSummary: () =>
    set({
      showSummary: false,
      summaryText: "",
      summaryCount: 0,
      summaryLoading: false,
      chatActive: false,
    }),

  addMessage: (msg) =>
    set((s) => ({ chatHistory: [...s.chatHistory, msg] })),

  setLastCaregiverText: (text) => set({ lastCaregiverText: text }),

  setQuickReplies: (replies) => set({ quickReplies: replies }),

  setActiveGrid: (grid) =>
    set({ activeGrid: grid.length > 0 ? grid : CORE_VOCABULARY }),

  addToken: (word) =>
    set((s) => ({ sentenceTokens: [...s.sentenceTokens, word] })),

  clearSentence: () => set({ sentenceTokens: [], excludedWords: [] }),

  addExcluded: (words) =>
    set((s) => ({ excludedWords: [...s.excludedWords, ...words] })),

  resetGrid: () =>
    set({ activeGrid: CORE_VOCABULARY, excludedWords: [] }),
}));

export { newId };