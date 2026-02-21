import { useState, useCallback, useEffect, useRef } from "react";
import { useRenderer, useKeyboard } from "@opentui/react";
import type { Screen, RoundResult, GameMode } from "./types";
import { TypingScreen } from "./components/typing-screen";
import { ResultsScreen } from "./components/results-screen";
import { ProfileScreen } from "./components/profile-screen";
import { StatusBar } from "./components/status-bar";
import { useTypingSession } from "./hooks/use-typing-session";
import { useStats } from "./hooks/use-stats";
import { saveSession, updateGoalProgress, getPersonalBests, getAggregateStats } from "./lib/db";
import { updateKBFromRound, getKBContext } from "./lib/kb";
import { getWhisper, getNarrative, closeAISession } from "./lib/ai";
import { GAME_MODE_CONFIGS, MODE_HOTKEYS } from "./lib/game-modes";

export function App() {
  const renderer = useRenderer();
  const [screen, setScreen] = useState<Screen>("typing");
  const [roundNumber, setRoundNumber] = useState(1);
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);
  const [previousWpm, setPreviousWpm] = useState<number | null>(null);
  const [whisperText, setWhisperText] = useState<string | null>(null);
  const [isNewPbWpm, setIsNewPbWpm] = useState(false);
  const [isNewPbAccuracy, setIsNewPbAccuracy] = useState(false);
  const [narrativeText, setNarrativeText] = useState<string | null>(null);
  const narrativeStaleRef = useRef(true);

  const handleRoundComplete = useCallback((result: RoundResult) => {
    const config = GAME_MODE_CONFIGS[result.gameMode];

    if (config.savesToDb) {
      // Check PBs before saving so current round isn't included
      const bests = getPersonalBests();
      setIsNewPbWpm(result.wpm > bests.bestWpm);
      setIsNewPbAccuracy(result.accuracy > bests.bestAccuracy);
      saveSession(result);
      updateGoalProgress(result.wpm, result.accuracy);
    } else {
      setIsNewPbWpm(false);
      setIsNewPbAccuracy(false);
    }

    if (config.updatesKb) {
      updateKBFromRound(result);
    }

    setCurrentResult(result);
    setWhisperText(null);
    setScreen("results");

    // Pre-fetch whisper (API call starts now, result arrives while user reads stats)
    const kbContext = getKBContext();
    getWhisper(result, kbContext).then((text) => {
      if (text) setWhisperText(text);
    });

    // Mark narrative as stale so it refreshes next time profile is opened
    if (config.savesToDb) {
      narrativeStaleRef.current = true;
    }
  }, []);

  const config = GAME_MODE_CONFIGS[gameMode];

  const session = useTypingSession({
    roundNumber,
    gameMode,
    onRoundComplete: handleRoundComplete,
  });

  const stats = useStats({
    isActive: session.isActive,
    roundStartTime: session.roundStartTime,
    correctCount: session.correctCount,
    totalTyped: session.totalTyped,
    timeLimitMs: config.timeLimitMs,
  });

  // Auto-complete when timer expires
  useEffect(() => {
    if (stats.timeExpired) {
      session.completeRound();
    }
  }, [stats.timeExpired]);

  const startNextRound = useCallback(() => {
    if (currentResult) {
      setPreviousWpm(currentResult.wpm);
    }
    setRoundNumber((n) => n + 1);
    setWhisperText(null);
    setScreen("typing");
  }, [currentResult]);

  const goToProfile = useCallback(() => {
    setScreen("profile");
    if (narrativeStaleRef.current) {
      narrativeStaleRef.current = false;
      const s = getAggregateStats();
      if (s.totalSessions >= 3) {
        const kbContext = getKBContext();
        getNarrative(s, kbContext).then((text) => {
          if (text) setNarrativeText(text);
        });
      }
    }
  }, []);

  const quit = useCallback(() => {
    closeAISession();
    renderer.destroy();
    process.exit(0);
  }, [renderer]);

  useKeyboard((key) => {
    key.preventDefault();

    if (key.name === "escape" || (key.ctrl && key.name === "c")) {
      quit();
      return;
    }

    if (screen === "typing") {
      if (key.name === "tab") { goToProfile(); return; }
      if (session.isComplete) {
        if (key.name === "n") { startNextRound(); }
        return;
      }

      if (!session.isActive && !key.ctrl && !key.meta && !key.option) {
        const mode = MODE_HOTKEYS[key.name];
        if (mode && mode !== gameMode) {
          setGameMode(mode);
          setRoundNumber((n) => n + 1);
          return;
        }
      }

      if (key.name === "space") {
        session.handleKeyPress(" ");
        return;
      }

      if (key.name.length === 1 && !key.ctrl && !key.meta && !key.option) {
        const char = key.shift ? key.name.toUpperCase() : key.name;
        session.handleKeyPress(char);
        return;
      }
    }

    if (screen === "results") {
      if (key.name === "n") { startNextRound(); return; }
      if (key.name === "q") { quit(); return; }
      if (key.name === "p") { goToProfile(); return; }
    }

    if (screen === "profile") {
      if (key.name === "tab") { setScreen("typing"); return; }
      if (key.name === "n") { startNextRound(); return; }
      if (key.name === "q") { quit(); return; }
    }
  });

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexGrow: 1 }}>
        {screen === "typing" && (
          <TypingScreen
            roundNumber={roundNumber}
            gameMode={gameMode}
            lines={session.lines}
            progress={config.timeLimitMs !== null ? stats.timeProgress : session.progress}
            wpm={stats.wpm}
            accuracy={stats.accuracy}
            elapsed={stats.elapsed}
            isActive={session.isActive}
          />
        )}
        {screen === "results" && currentResult && (
          <ResultsScreen
            result={currentResult}
            previousWpm={previousWpm}
            whisperText={whisperText}
            isNewPbWpm={isNewPbWpm}
            isNewPbAccuracy={isNewPbAccuracy}
          />
        )}
        {screen === "profile" && <ProfileScreen narrative={narrativeText} />}
      </box>
      <StatusBar screen={screen} />
    </box>
  );
}
