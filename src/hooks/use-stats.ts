import { useState, useEffect } from "react";

interface UseStatsOptions {
  isActive: boolean;
  roundStartTime: number;
  correctCount: number;
  totalTyped: number;
  timeLimitMs: number | null;
}

interface UseStatsReturn {
  wpm: number;
  accuracy: number;
  elapsed: string;
  timeExpired: boolean;
  timeProgress: number;
}

export function useStats({
  isActive,
  roundStartTime,
  correctCount,
  totalTyped,
  timeLimitMs,
}: UseStatsOptions): UseStatsReturn {
  const [_tick, setTick] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(interval);
  }, [isActive]);

  const elapsedMs = isActive && roundStartTime > 0 ? Date.now() - roundStartTime : 0;
  const minutes = elapsedMs / 60000;

  const wpm = minutes > 0.033 && correctCount > 0 ? Math.round((correctCount / 5) / minutes) : 0;
  const accuracy = totalTyped > 0 ? Math.round((correctCount / totalTyped) * 1000) / 10 : 100;

  let displayMs: number;
  let timeExpired = false;
  let timeProgress = 0;

  if (timeLimitMs !== null) {
    const remaining = Math.max(0, timeLimitMs - elapsedMs);
    displayMs = remaining;
    timeExpired = remaining <= 0 && isActive;
    timeProgress = Math.min(100, Math.round((elapsedMs / timeLimitMs) * 100));
  } else {
    displayMs = elapsedMs;
  }

  const totalSeconds = timeLimitMs !== null ? Math.ceil(displayMs / 1000) : Math.floor(displayMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const elapsed = `${mins}:${secs.toString().padStart(2, "0")}`;

  return { wpm, accuracy, elapsed, timeExpired, timeProgress };
}
