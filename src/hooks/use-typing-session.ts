import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { TypedChar, TypedLine, KeystrokeEvent, KeyAccuracy, RoundResult } from "../types";
import { generateRoundText, splitIntoLines } from "../lib/words";
import { getPerKeyAccuracy } from "../lib/db";

interface UseTypingSessionOptions {
  roundNumber: number;
  onRoundComplete: (result: RoundResult) => void;
}

export function useTypingSession({ roundNumber, onRoundComplete }: UseTypingSessionOptions) {
  const [chars, setChars] = useState<TypedChar[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [targetText, setTargetText] = useState("");

  const cursorRef = useRef(0);
  const [cursorIndex, setCursorIndex] = useState(0);

  const keystrokeLogRef = useRef<KeystrokeEvent[]>([]);
  const roundStartTimeRef = useRef<number>(0);
  const correctCountRef = useRef(0);
  const errorCountRef = useRef(0);
  const totalTypedRef = useRef(0);
  const isCompleteRef = useRef(false);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const keyAccuracies = getPerKeyAccuracy();
    const text = generateRoundText(100, keyAccuracies);
    setTargetText(text);
    setChars(
      text.split("").map((char, i) => ({
        char,
        state: i === 0 ? "current" : "upcoming",
      }))
    );
    cursorRef.current = 0;
    setCursorIndex(0);
    setIsActive(false);
    setIsComplete(false);
    isCompleteRef.current = false;
    isActiveRef.current = false;
    keystrokeLogRef.current = [];
    roundStartTimeRef.current = 0;
    correctCountRef.current = 0;
    errorCountRef.current = 0;
    totalTypedRef.current = 0;
  }, [roundNumber]);

  const lines = useMemo<TypedLine[]>(() => {
    if (chars.length === 0 || !targetText) return [];

    const lineTexts = splitIntoLines(targetText, 50);
    const result: TypedLine[] = [];
    let charIdx = 0;

    for (let lineIdx = 0; lineIdx < lineTexts.length; lineIdx++) {
      const lineText = lineTexts[lineIdx];
      const lineChars: TypedChar[] = [];
      for (let i = 0; i < lineText.length; i++) {
        if (charIdx < chars.length) {
          lineChars.push(chars[charIdx]);
          charIdx++;
        }
      }
      // Include trailing space in this line so user types it at end of line
      if (lineIdx < lineTexts.length - 1 && charIdx < chars.length && chars[charIdx]?.char === " ") {
        lineChars.push(chars[charIdx]);
        charIdx++;
      }
      result.push({ chars: lineChars });
    }

    return result;
  }, [chars, targetText]);

  const handleKeyPress = useCallback(
    (keyName: string) => {
      if (isCompleteRef.current) return;

      // Start timer on first keypress
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        setIsActive(true);
        roundStartTimeRef.current = Date.now();
      }

      const now = Date.now();
      const elapsed = roundStartTimeRef.current > 0 ? now - roundStartTimeRef.current : 0;
      const idx = cursorRef.current;

      setChars((prev) => {
        const next = [...prev];
        if (idx >= next.length) return prev;

        const target = next[idx];
        const isCorrect = keyName === target.char;
        totalTypedRef.current++;

        keystrokeLogRef.current.push({
          key: keyName,
          timestamp: elapsed,
          isError: !isCorrect,
          targetChar: target.char,
        });

        if (!isCorrect) {
          // Wrong key: mark error, cursor stays
          errorCountRef.current++;
          next[idx] = { ...target, state: "current", hadError: true };
          return next;
        }

        // Correct key: advance cursor
        correctCountRef.current++;
        next[idx] = { ...target, state: target.hadError ? "error" : "typed" };

        const newIdx = idx + 1;

        // Check if round is complete
        if (newIdx >= next.length) {
          cursorRef.current = newIdx;
          setCursorIndex(newIdx);

          isCompleteRef.current = true;
          isActiveRef.current = false;
          setIsComplete(true);
          setIsActive(false);

          const duration = Date.now() - roundStartTimeRef.current;
          const minutes = duration / 60000;
          const wpm = minutes > 0 ? Math.round((correctCountRef.current / 5) / minutes) : 0;
          const rawWpm = minutes > 0 ? Math.round((totalTypedRef.current / 5) / minutes) : 0;
          const accuracy =
            totalTypedRef.current > 0
              ? Math.round((correctCountRef.current / totalTypedRef.current) * 1000) / 10
              : 100;

          const keyStats = new Map<string, { correct: number; incorrect: number }>();
          for (const event of keystrokeLogRef.current) {
            if (!event.targetChar) continue;
            const k = event.targetChar.toLowerCase();
            if (k.length !== 1 || k < "a" || k > "z") continue;
            if (!keyStats.has(k)) keyStats.set(k, { correct: 0, incorrect: 0 });
            const stat = keyStats.get(k)!;
            if (event.isError) stat.incorrect++;
            else stat.correct++;
          }

          const keyAccuracies: KeyAccuracy[] = Array.from(keyStats.entries())
            .map(([key, { correct, incorrect }]) => ({
              key,
              correct,
              incorrect,
              total: correct + incorrect,
              accuracy: correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100,
            }))
            .sort((a, b) => a.key.localeCompare(b.key));

          const problemKeys = keyAccuracies
            .filter((k) => k.accuracy < 80 && k.total >= 2)
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((k) => k.key);

          const wordCount = targetText.split(" ").length;

          setTimeout(() => {
            onRoundComplete({
              roundNumber,
              wpm,
              rawWpm,
              accuracy,
              duration,
              charCount: next.length,
              errorCount: errorCountRef.current,
              wordCount,
              keystrokeLog: [...keystrokeLogRef.current],
              keyAccuracies,
              problemKeys,
              timestamp: new Date(),
            });
          }, 0);

          return next;
        }

        // Set next character as current
        next[newIdx] = { ...next[newIdx], state: "current" };
        cursorRef.current = newIdx;
        setCursorIndex(newIdx);
        return next;
      });
    },
    [targetText, roundNumber, onRoundComplete]
  );

  const progress = chars.length > 0 ? Math.round((cursorIndex / chars.length) * 100) : 0;

  return {
    lines,
    cursorIndex,
    isActive,
    isComplete,
    totalChars: chars.length,
    typedCount: cursorIndex,
    correctCount: correctCountRef.current,
    totalTyped: totalTypedRef.current,
    errorCount: errorCountRef.current,
    progress,
    handleKeyPress,
    roundStartTime: roundStartTimeRef.current,
  };
}
