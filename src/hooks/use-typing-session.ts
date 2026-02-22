import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { TypedChar, TypedLine, KeystrokeEvent, KeyAccuracy, RoundResult, GameMode, ProblemWord } from "../types";
import { generateRoundText, generateWarmupText, applyPunctuation, splitIntoLines } from "../lib/words";
import { getPerKeyAccuracy } from "../lib/db";
import { GAME_MODE_CONFIGS } from "../lib/game-modes";

interface UseTypingSessionOptions {
  roundNumber: number;
  resetKey?: number;
  gameMode: GameMode;
  punctuation?: boolean;
  onRoundComplete: (result: RoundResult) => void;
  getInitialText?: () => string | null;
}

function deriveProblemWords(keystrokeLog: KeystrokeEvent[], targetText: string): ProblemWord[] {
  const words: { word: string; start: number; end: number }[] = [];
  let pos = 0;
  for (const w of targetText.split(" ")) {
    words.push({ word: w, start: pos, end: pos + w.length - 1 });
    pos += w.length + 1;
  }

  const wordErrors = new Map<string, { word: string; errors: number }>();
  let cursor = 0;
  for (const event of keystrokeLog) {
    if (event.isError) {
      const wordEntry = words.find((w) => cursor >= w.start && cursor <= w.end);
      if (wordEntry) {
        const key = `${wordEntry.word}:${wordEntry.start}`;
        const existing = wordErrors.get(key);
        if (existing) existing.errors++;
        else wordErrors.set(key, { word: wordEntry.word, errors: 1 });
      }
    } else {
      cursor++;
    }
  }

  const merged = new Map<string, number>();
  for (const { word, errors } of wordErrors.values()) {
    merged.set(word, (merged.get(word) || 0) + errors);
  }

  return Array.from(merged.entries())
    .map(([word, errors]) => ({ word, errors }))
    .sort((a, b) => b.errors - a.errors);
}

export function useTypingSession({ roundNumber, resetKey, gameMode, punctuation, onRoundComplete, getInitialText }: UseTypingSessionOptions) {
  const [chars, setChars] = useState<TypedChar[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const targetTextRef = useRef("");

  const initWithText = useCallback((text: string) => {
    setTargetText(text);
    targetTextRef.current = text;
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
    setIsLoading(false);
    isCompleteRef.current = false;
    isActiveRef.current = false;
    keystrokeLogRef.current = [];
    roundStartTimeRef.current = 0;
    correctCountRef.current = 0;
    errorCountRef.current = 0;
    totalTypedRef.current = 0;
  }, []);

  useEffect(() => {
    const config = GAME_MODE_CONFIGS[gameMode];

    if (gameMode === "ai") {
      const aiText = getInitialText?.();
      if (aiText && aiText.length >= 20) {
        initWithText(aiText);
      } else {
        // Show loading state, poll for AI text
        setIsLoading(true);
        setChars([]);
        setTargetText("");
        const interval = setInterval(() => {
          const text = getInitialText?.();
          if (text && text.length >= 20) {
            clearInterval(interval);
            initWithText(text);
          }
        }, 200);
        return () => clearInterval(interval);
      }
    } else {
      const keyAccuracies = getPerKeyAccuracy();
      const rawText = gameMode === "warmup"
        ? generateWarmupText(config.targetChars, keyAccuracies)
        : generateRoundText(config.targetChars, keyAccuracies);
      initWithText(punctuation ? applyPunctuation(rawText) : rawText);
    }
  }, [roundNumber, resetKey, gameMode, punctuation]);

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
      if (lineIdx < lineTexts.length - 1 && charIdx < chars.length && chars[charIdx]?.char === " ") {
        lineChars.push(chars[charIdx]);
        charIdx++;
      }
      result.push({ chars: lineChars });
    }

    return result;
  }, [chars, targetText]);

  const buildResult = useCallback((): RoundResult => {
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

    const typedText = targetTextRef.current.substring(0, cursorRef.current);
    const wordCount = typedText.trim().split(/\s+/).filter(Boolean).length;
    const problemWords = deriveProblemWords(keystrokeLogRef.current, typedText);

    return {
      roundNumber,
      gameMode,
      wpm,
      rawWpm,
      accuracy,
      duration,
      charCount: cursorRef.current,
      errorCount: errorCountRef.current,
      wordCount,
      keystrokeLog: [...keystrokeLogRef.current],
      keyAccuracies,
      problemKeys,
      problemWords,
      timestamp: new Date(),
    };
  }, [roundNumber, gameMode]);

  const completeRound = useCallback(() => {
    if (isCompleteRef.current) return;

    isCompleteRef.current = true;
    isActiveRef.current = false;
    setIsComplete(true);
    setIsActive(false);

    const result = buildResult();
    setTimeout(() => onRoundComplete(result), 0);
  }, [buildResult, onRoundComplete]);

  const handleKeyPress = useCallback(
    (keyName: string) => {
      if (isCompleteRef.current) return;

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
          errorCountRef.current++;
          next[idx] = { ...target, state: "current", hadError: true };
          return next;
        }

        correctCountRef.current++;
        next[idx] = { ...target, state: target.hadError ? "error" : "typed" };

        const newIdx = idx + 1;

        if (newIdx >= next.length) {
          cursorRef.current = newIdx;
          setCursorIndex(newIdx);
          completeRound();
          return next;
        }

        // Timed modes: extend text when nearing end
        const config = GAME_MODE_CONFIGS[gameMode];
        if (config.timeLimitMs !== null && next.length - newIdx < 50) {
          const rawMore = generateRoundText(200, getPerKeyAccuracy());
          const moreText = " " + (punctuation ? applyPunctuation(rawMore) : rawMore);
          const moreChars: TypedChar[] = moreText.split("").map((char) => ({
            char,
            state: "upcoming" as const,
          }));
          next.push(...moreChars);
          targetTextRef.current += moreText;
          setTargetText(targetTextRef.current);
        }

        next[newIdx] = { ...next[newIdx], state: "current" };
        cursorRef.current = newIdx;
        setCursorIndex(newIdx);
        return next;
      });
    },
    [gameMode, punctuation, completeRound]
  );

  // Immediately reset refs when resetKey changes (before useEffect fires).
  // This prevents stale stats from flashing during the intermediate render.
  const prevResetKeyRef = useRef(resetKey);
  if (resetKey !== undefined && resetKey !== prevResetKeyRef.current) {
    prevResetKeyRef.current = resetKey;
    cursorRef.current = 0;
    isActiveRef.current = false;
    isCompleteRef.current = false;
    roundStartTimeRef.current = 0;
    correctCountRef.current = 0;
    errorCountRef.current = 0;
    totalTypedRef.current = 0;
    keystrokeLogRef.current = [];
  }

  const progress = chars.length > 0 ? Math.round((cursorIndex / chars.length) * 100) : 0;

  return {
    lines,
    isActive,
    isComplete,
    isLoading,
    correctCount: correctCountRef.current,
    totalTyped: totalTypedRef.current,
    progress,
    handleKeyPress,
    roundStartTime: roundStartTimeRef.current,
    completeRound,
  };
}
