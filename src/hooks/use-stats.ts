import { useState, useEffect } from "react";

interface UseStatsReturn {
  wpm: number;
  accuracy: number;
  elapsed: string;
  elapsedMs: number;
}

export function useStats(
  isActive: boolean,
  roundStartTime: number,
  correctCount: number,
  totalTyped: number
): UseStatsReturn {
  const [tick, setTick] = useState(0);

  // Poll at 500ms for smooth updates
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [isActive]);

  const elapsedMs = isActive && roundStartTime > 0 ? Date.now() - roundStartTime : 0;
  const minutes = elapsedMs / 60000;

  // Only compute WPM after 2 seconds to avoid wild initial values
  const wpm = minutes > 0.033 && correctCount > 0 ? Math.round((correctCount / 5) / minutes) : 0;

  const accuracy = totalTyped > 0 ? Math.round((correctCount / totalTyped) * 1000) / 10 : 100;

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const elapsed = `${mins}:${secs.toString().padStart(2, "0")}`;

  // Reference tick to ensure re-renders from the interval
  void tick;

  return { wpm, accuracy, elapsed, elapsedMs };
}
