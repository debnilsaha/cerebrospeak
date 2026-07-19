// Speculative prefetch cache for grid predictions.
// Keyed by a signature of (tokens + caregiver text) so we can serve the next
// grid instantly when the child taps the most-likely (top-ranked) word.

import { useCallback, useRef } from "react";
import { api } from "../api/client";
import type { GridPredictionResponse } from "../api/types";

function makeKey(tokens: string[], caregiver: string): string {
  return `${caregiver}||${tokens.join(">")}`;
}

export function useGridPrefetch() {
  const cacheRef = useRef<Map<string, GridPredictionResponse>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());

  // Prefetch the grid that would result from appending `nextWord`.
  const prefetch = useCallback(
    async (
      currentTokens: string[],
      nextWord: string,
      caregiver: string,
      excludeWords: string[],
      timeOfDay: string,
      gridSize: number,
    ) => {
      const nextTokens = [...currentTokens, nextWord];
      const key = makeKey(nextTokens, caregiver);

      // Skip if already cached or already being fetched.
      if (cacheRef.current.has(key) || inFlightRef.current.has(key)) return;

      inFlightRef.current.add(key);
      try {
        const res = await api.predictGrid({
          current_tokens: nextTokens,
          caregiver_utterance: caregiver,
          exclude_words: [...excludeWords, nextWord],
          time_of_day: timeOfDay,
          grid_size: gridSize,
        });
        cacheRef.current.set(key, res);
      } catch {
        // Prefetch failures are silent — the real tap will just fetch normally.
      } finally {
        inFlightRef.current.delete(key);
      }
    },
    [],
  );

  // Try to get a cached grid for the given token sequence.
  const getCached = useCallback(
    (tokens: string[], caregiver: string): GridPredictionResponse | null => {
      const key = makeKey(tokens, caregiver);
      const hit = cacheRef.current.get(key) ?? null;
      return hit;
    },
    [],
  );

  // Clear the cache (e.g. on new caregiver utterance or session reset).
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    inFlightRef.current.clear();
  }, []);

  return { prefetch, getCached, clearCache };
}