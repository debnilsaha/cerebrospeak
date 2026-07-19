// Row-column switch scanning engine.
//
// Phase "row": highlight advances row by row every `speedMs`. Activating the
// switch selects the current row and moves to phase "col".
// Phase "col": highlight advances across cells in the selected row. Activating
// selects that cell (fires onSelect) and returns to phase "row".
//
// One "switch" = a call to activate(). Wire it to a button, key, or tap-anywhere.

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSwitchScanningOptions {
  enabled: boolean;
  itemCount: number;
  columns: number;
  speedMs: number;
  onSelect: (index: number) => void;
}

type Phase = "row" | "col";

export function useSwitchScanning({
  enabled,
  itemCount,
  columns,
  speedMs,
  onSelect,
}: UseSwitchScanningOptions) {
  const rowCount = Math.max(1, Math.ceil(itemCount / columns));

  const [phase, setPhase] = useState<Phase>("row");
  const [rowIndex, setRowIndex] = useState(0);
  const [colIndex, setColIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Which flat indices are currently highlighted (a whole row, or one cell).
  const highlightedIndices = useCallback((): number[] => {
    if (!enabled) return [];
    if (phase === "row") {
      const start = rowIndex * columns;
      const indices: number[] = [];
      for (let c = 0; c < columns; c++) {
        const idx = start + c;
        if (idx < itemCount) indices.push(idx);
      }
      return indices;
    }
    // col phase: single cell
    const idx = rowIndex * columns + colIndex;
    return idx < itemCount ? [idx] : [];
  }, [enabled, phase, rowIndex, colIndex, columns, itemCount]);

  // Advance the scan on a timer.
  useEffect(() => {
    if (!enabled || itemCount === 0) return;

    timerRef.current = window.setInterval(() => {
      if (phase === "row") {
        setRowIndex((r) => (r + 1) % rowCount);
      } else {
        // advance across columns that actually have cells in this row
        setColIndex((c) => {
          const cellsInRow = Math.min(columns, itemCount - rowIndex * columns);
          return (c + 1) % Math.max(1, cellsInRow);
        });
      }
    }, speedMs);

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [enabled, phase, rowCount, columns, itemCount, rowIndex, speedMs]);

  // Reset to the top whenever scanning is (re)enabled or the grid changes.
  useEffect(() => {
    if (enabled) {
      setPhase("row");
      setRowIndex(0);
      setColIndex(0);
    }
  }, [enabled, itemCount]);

  // The single switch action.
  const activate = useCallback(() => {
    if (!enabled || itemCount === 0) return;
    if (phase === "row") {
      setPhase("col");
      setColIndex(0);
    } else {
      const idx = rowIndex * columns + colIndex;
      if (idx < itemCount) onSelect(idx);
      setPhase("row");
      setColIndex(0);
    }
  }, [enabled, phase, rowIndex, colIndex, columns, itemCount, onSelect]);

  return { highlightedIndices: highlightedIndices(), phase, activate };
}