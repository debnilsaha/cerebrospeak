import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore, CORE_VOCABULARY } from "../stores/sessionStore";

// Reset the store to a clean state before each test.
beforeEach(() => {
  useSessionStore.setState({
    chatActive: false,
    busy: false,
    sessionId: null,
    chatHistory: [],
    lastCaregiverText: "",
    quickReplies: [],
    sentenceTokens: [],
    activeGrid: CORE_VOCABULARY,
    excludedWords: [],
    showSummary: false,
    summaryText: "",
    summaryCount: 0,
    summaryLoading: false,
  });
});

describe("sessionStore", () => {
  it("starts a session and clears prior state", () => {
    useSessionStore.getState().addToken("hello");
    useSessionStore.getState().startSession();
    const s = useSessionStore.getState();
    expect(s.chatActive).toBe(true);
    expect(s.sentenceTokens).toEqual([]);
  });

  it("adds tokens to the sentence", () => {
    const { addToken } = useSessionStore.getState();
    addToken("I");
    addToken("want");
    expect(useSessionStore.getState().sentenceTokens).toEqual(["I", "want"]);
  });

  it("clears the sentence", () => {
    const store = useSessionStore.getState();
    store.addToken("I");
    store.addExcluded(["I"]);
    store.clearSentence();
    const s = useSessionStore.getState();
    expect(s.sentenceTokens).toEqual([]);
    expect(s.excludedWords).toEqual([]);
  });

  it("never sets an empty grid — falls back to core vocabulary", () => {
    useSessionStore.getState().setActiveGrid([]);
    expect(useSessionStore.getState().activeGrid).toEqual(CORE_VOCABULARY);
  });

  it("sets a non-empty grid when given real words", () => {
    const grid = [
      { word: "yes", category: "social" as const, urgent: false, rank: 1, reason: "" },
    ];
    useSessionStore.getState().setActiveGrid(grid);
    expect(useSessionStore.getState().activeGrid).toEqual(grid);
  });

  it("tracks excluded words", () => {
    useSessionStore.getState().addExcluded(["apple", "banana"]);
    expect(useSessionStore.getState().excludedWords).toEqual(["apple", "banana"]);
  });

  it("manages the summary lifecycle", () => {
    const store = useSessionStore.getState();
    store.openSummary();
    expect(useSessionStore.getState().showSummary).toBe(true);
    expect(useSessionStore.getState().summaryLoading).toBe(true);

    store.setSummary("A nice chat.", 3);
    expect(useSessionStore.getState().summaryText).toBe("A nice chat.");
    expect(useSessionStore.getState().summaryCount).toBe(3);
    expect(useSessionStore.getState().summaryLoading).toBe(false);

    store.closeSummary();
    expect(useSessionStore.getState().showSummary).toBe(false);
    expect(useSessionStore.getState().chatActive).toBe(false);
  });
});