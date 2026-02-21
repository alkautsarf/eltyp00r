import { useState, useCallback, useEffect } from "react";
import { useRenderer, useKeyboard } from "@opentui/react";
import type { Screen, RoundResult } from "./types";
import { TypingScreen } from "./components/typing-screen";
import { ResultsScreen } from "./components/results-screen";
import { ProfileScreen } from "./components/profile-screen";
import { StatusBar } from "./components/status-bar";
import { useTypingSession } from "./hooks/use-typing-session";
import { useStats } from "./hooks/use-stats";
import { saveSession, updateGoalProgress, getPersonalBests } from "./lib/db";
import { updateKBFromRound, getKBContext } from "./lib/kb";
import { getWhisper } from "./lib/ai";

export function App() {
  const renderer = useRenderer();
  const [screen, setScreen] = useState<Screen>("typing");
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);
  const [previousWpm, setPreviousWpm] = useState<number | null>(null);
  const [whisperText, setWhisperText] = useState<string | null>(null);
  const [isNewPbWpm, setIsNewPbWpm] = useState(false);
  const [isNewPbAccuracy, setIsNewPbAccuracy] = useState(false);

  const handleRoundComplete = useCallback((result: RoundResult) => {
    // Check PBs before saving so current round isn't included
    const bests = getPersonalBests();
    setIsNewPbWpm(result.wpm > bests.bestWpm);
    setIsNewPbAccuracy(result.accuracy > bests.bestAccuracy);

    saveSession(result);
    updateKBFromRound(result);
    updateGoalProgress(result.wpm, result.accuracy);
    setCurrentResult(result);
    setWhisperText(null);
    setScreen("results");
  }, []);

  // Fetch AI whisper when results screen shows
  useEffect(() => {
    if (screen !== "results" || !currentResult) return;

    let cancelled = false;
    const kbContext = getKBContext();
    getWhisper(currentResult, kbContext).then((text) => {
      if (!cancelled && text) setWhisperText(text);
    });

    return () => { cancelled = true; };
  }, [screen, currentResult]);

  const session = useTypingSession({
    roundNumber,
    onRoundComplete: handleRoundComplete,
  });

  const stats = useStats(
    session.isActive,
    session.roundStartTime,
    session.correctCount,
    session.totalTyped
  );

  const startNextRound = useCallback(() => {
    if (currentResult) {
      setPreviousWpm(currentResult.wpm);
    }
    setRoundNumber((n) => n + 1);
    setWhisperText(null);
    setScreen("typing");
  }, [currentResult]);

  useKeyboard((key) => {
    key.preventDefault();

    if (key.name === "escape" || (key.ctrl && key.name === "c")) {
      renderer.destroy();
      process.exit(0);
      return;
    }

    if (screen === "typing") {
      if (key.name === "tab") { setScreen("profile"); return; }
      if (session.isComplete) {
        if (key.name === "n") { startNextRound(); }
        return;
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
      if (key.name === "q") { renderer.destroy(); process.exit(0); return; }
      if (key.name === "p") { setScreen("profile"); return; }
    }

    if (screen === "profile") {
      if (key.name === "tab") { setScreen("typing"); return; }
      if (key.name === "n") { startNextRound(); return; }
      if (key.name === "q") { renderer.destroy(); process.exit(0); return; }
    }
  });

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexGrow: 1 }}>
        {screen === "typing" && (
          <TypingScreen
            roundNumber={roundNumber}
            lines={session.lines}
            progress={session.progress}
            wpm={stats.wpm}
            accuracy={stats.accuracy}
            elapsed={stats.elapsed}
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
        {screen === "profile" && <ProfileScreen />}
      </box>
      <StatusBar screen={screen} />
    </box>
  );
}
