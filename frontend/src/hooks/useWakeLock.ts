// Keeps the screen awake during an active session (Screen Wake Lock API).
// Silently no-ops on browsers that don't support it.

import { useEffect } from "react";

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let wakeLock: WakeLockSentinel | null = null;
    let released = false;

    async function requestLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake lock not available or denied — ignore gracefully.
      }
    }

    // Re-acquire if the tab becomes visible again.
    function onVisibility() {
      if (document.visibilityState === "visible" && !released) {
        requestLock();
      }
    }

    requestLock();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLock?.release().catch(() => {});
    };
  }, [active]);
}