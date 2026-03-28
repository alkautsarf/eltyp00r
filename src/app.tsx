import { useState, useCallback, useEffect, useRef } from "react";
import { useRenderer, useKeyboard } from "@opentui/react";
import type { Screen, RoundResult, GameMode } from "./types";
import { TypingScreen } from "./components/typing-screen";
import { ResultsScreen } from "./components/results-screen";
import { ProfileScreen } from "./components/profile-screen";
import { LobbyScreen } from "./components/lobby-screen";
import { StatusBar } from "./components/status-bar";
import { useTypingSession } from "./hooks/use-typing-session";
import { useStats } from "./hooks/use-stats";
import { useMultiplayer } from "./hooks/use-multiplayer";
import { saveSession, updateGoalProgress, getPersonalBests, getAggregateStats } from "./lib/db";
import { updateKBFromRound, getKBContext } from "./lib/kb";
import { getWhisper, getAllNarratives, generateAISentences, closeAISession, flushAIBuffer } from "./lib/ai";
import { GAME_MODE_CONFIGS, MODE_HOTKEYS } from "./lib/game-modes";

type NarrativeCacheKey = "all" | "noPunct" | "punct";
function filterCacheKey(filter: boolean | undefined): NarrativeCacheKey {
  return filter === undefined ? "all" : filter ? "punct" : "noPunct";
}

export function App({ aiEnabled = false, playerName = "guest", serverUrl }: { aiEnabled?: boolean; playerName?: string; serverUrl?: string }) {
  const renderer = useRenderer();
  const [screen, setScreen] = useState<Screen>("typing");
  const [roundNumber, setRoundNumber] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);
  const [previousWpm, setPreviousWpm] = useState<number | null>(null);
  const [whisperText, setWhisperText] = useState<string | null>(null);
  const [isNewPbWpm, setIsNewPbWpm] = useState(false);
  const [isNewPbAccuracy, setIsNewPbAccuracy] = useState(false);
  const [narrativeText, setNarrativeText] = useState<string | null>(null);
  const narrativeCacheRef = useRef<Map<string, string>>(new Map());
  const [punctuation, setPunctuation] = useState(false);
  const punctuationRef = useRef(false);
  punctuationRef.current = punctuation;
  const narrativeStaleRef = useRef(true);
  const aiTextRef = useRef<string | null>(null);
  const [profileFilter, setProfileFilter] = useState<boolean | undefined>(undefined);
  const multiplayer = useMultiplayer({ playerName: playerName!, serverUrl });
  const multiplayerActive = gameMode === "multiplayer";
  const [raceCountdown, setRaceCountdown] = useState<number | null>(null);

  const preGenerateAIText = useCallback(() => {
    if (!aiEnabled) return;
    aiTextRef.current = null;
    generateAISentences(getKBContext(), punctuationRef.current).then((text) => {
      if (text && text.length >= 20) {
        aiTextRef.current = text;
      }
    }).catch(() => {});
  }, [aiEnabled]);

  // Session warm-up happens via startSession() on module load in ai.ts.
  // AI text pre-generation only fires when switching to AI mode or after an AI round.

  const raceTextRef = useRef<string | null>(null);
  raceTextRef.current = multiplayer.raceText;

  const getInitialText = useCallback(() => {
    if (gameMode === "multiplayer") {
      return raceTextRef.current;
    }
    const text = aiTextRef.current;
    aiTextRef.current = null;
    return text;
  }, [gameMode]);

  const handleRoundComplete = useCallback((result: RoundResult) => {
    const config = GAME_MODE_CONFIGS[result.gameMode];

    if (result.gameMode === "multiplayer") {
      multiplayer.sendFinish(result.wpm, result.accuracy, result.duration, result.errorCount, result.charCount);
    }

    if (config.savesToDb) {
      // Check PBs before saving so current round isn't included
      const bests = getPersonalBests(result.punctuation);
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
    if (aiEnabled) {
      const kbContext = getKBContext();
      getWhisper(result, kbContext)
        .then((text) => { if (text) setWhisperText(text); })
        .catch(() => {});
    }

    // Mark narrative as stale so it refreshes next time profile is opened
    if (config.savesToDb) {
      narrativeStaleRef.current = true;
      narrativeCacheRef.current.clear();
    }

    // Pre-generate AI text for next round
    if (result.gameMode === "ai") {
      preGenerateAIText();
    }
  }, [preGenerateAIText]);

  const config = GAME_MODE_CONFIGS[gameMode];

  const session = useTypingSession({
    roundNumber,
    resetKey,
    gameMode,
    punctuation,
    onRoundComplete: handleRoundComplete,
    getInitialText,
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

  // Multiplayer: report progress to server
  useEffect(() => {
    if (multiplayerActive && session.isActive) {
      multiplayer.sendProgress(session.cursorIndex, stats.wpm);
    }
  }, [multiplayerActive, session.isActive, session.cursorIndex, stats.wpm]);

  // Multiplayer: transition to typing screen when NEW race text arrives
  // Only depends on raceText — NOT screen. If screen were a dependency,
  // transitioning to "results" while old raceText is still set would
  // prematurely fire this effect (before onRaceEnd clears raceText).
  useEffect(() => {
    if (multiplayerActive && multiplayer.raceText) {
      setScreen("typing");
      setRoundNumber((n) => n + 1);
      setRaceCountdown(3);
    }
  }, [multiplayerActive, multiplayer.raceText]);

  // Multiplayer: tick the on-screen countdown
  useEffect(() => {
    if (raceCountdown === null || raceCountdown <= 0) return;
    const timer = setTimeout(() => setRaceCountdown(raceCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [raceCountdown]);

  // Multiplayer: start timer when countdown hits 0
  useEffect(() => {
    if (raceCountdown === 0 && multiplayerActive) {
      session.startTimer();
      setRaceCountdown(null);
    }
  }, [raceCountdown, multiplayerActive]);

  // Multiplayer: when opponent finishes, force-complete local round
  useEffect(() => {
    if (!multiplayerActive) return;
    const opponentFinished = multiplayer.opponents.some((o) => o.finished);
    if (opponentFinished && session.isActive && !session.isComplete) {
      session.completeRound();
    }
  }, [multiplayerActive, multiplayer.opponents, session.isActive, session.isComplete]);

  const startNextRound = useCallback(() => {
    if (currentResult) {
      setPreviousWpm(currentResult.wpm);
    }
    setRoundNumber((n) => n + 1);
    setWhisperText(null);
    setScreen("typing");
  }, [currentResult]);

  const fetchAllNarratives = useCallback((displayFilter?: boolean) => {
    if (!aiEnabled) return;
    const allStats = getAggregateStats(undefined);
    const noPunctStats = getAggregateStats(false);
    const punctStats = getAggregateStats(true);
    const kbContext = getKBContext();

    getAllNarratives(
      allStats.totalSessions >= 3 ? allStats : null,
      noPunctStats.totalSessions >= 3 ? noPunctStats : null,
      punctStats.totalSessions >= 3 ? punctStats : null,
      kbContext
    ).then((results) => {
      if (results.all) narrativeCacheRef.current.set("all", results.all);
      if (results.noPunct) narrativeCacheRef.current.set("noPunct", results.noPunct);
      if (results.punct) narrativeCacheRef.current.set("punct", results.punct);

      const text = narrativeCacheRef.current.get(filterCacheKey(displayFilter));
      setNarrativeText(text || null);
    });
  }, [aiEnabled]);

  const goToProfile = useCallback(() => {
    setScreen("profile");
    if (aiEnabled && narrativeStaleRef.current) {
      narrativeStaleRef.current = false;
      const cached = narrativeCacheRef.current.get(filterCacheKey(profileFilter));
      if (cached) setNarrativeText(cached);
      fetchAllNarratives(profileFilter);
    }
  }, [aiEnabled, profileFilter, fetchAllNarratives]);

  const cycleProfileFilter = useCallback(() => {
    const next = profileFilter === undefined ? false : profileFilter === false ? true : undefined;
    setProfileFilter(next);
    setNarrativeText(narrativeCacheRef.current.get(filterCacheKey(next)) || null);
  }, [profileFilter]);

  const leaveMultiplayer = useCallback(() => {
    multiplayer.leave();
    setGameMode("normal");
    setScreen("typing");
  }, [multiplayer]);

  const quit = useCallback(() => {
    if (aiEnabled) closeAISession();
    renderer.destroy();
    process.exit(0);
  }, [renderer, aiEnabled]);

  useKeyboard((key) => {
    key.preventDefault();

    if (key.name === "escape" || (key.ctrl && key.name === "c")) {
      quit();
      return;
    }

    if (screen === "lobby") {
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        leaveMultiplayer();
        return;
      }
      const { lobbyState } = multiplayer;
      if (lobbyState.phase === "idle") {
        if (key.name === "c") { multiplayer.createRoom(); return; }
        if (key.name === "j") { multiplayer.startJoining(); return; }
      }
      if (lobbyState.phase === "joining") {
        if (key.name === "backspace") {
          if (lobbyState.codeInput.length > 0) {
            multiplayer.updateCodeInput(lobbyState.codeInput.slice(0, -1));
          }
          return;
        }
        if (key.name.length === 1 && key.name >= "a" && key.name <= "z") {
          const newCode = lobbyState.codeInput + key.name.toUpperCase();
          if (newCode.length >= 4) {
            multiplayer.joinRoom(newCode);
          } else {
            multiplayer.updateCodeInput(newCode);
          }
          return;
        }
      }
      if (lobbyState.phase === "error") {
        multiplayer.dismissError();
      }
      return;
    }

    if (screen === "typing") {
      if (key.name === "tab") {
        if (session.isActive) {
          if (multiplayerActive) return; // no restart during multiplayer race
          if (gameMode === "ai") preGenerateAIText();
          setResetKey((n) => n + 1);
        } else {
          goToProfile();
        }
        return;
      }
      if (session.isComplete) {
        if (key.name === "n") startNextRound();
        return;
      }

      if (!session.isActive && !multiplayerActive && !key.ctrl && !key.meta && !key.option) {
        if (key.name === "`") {
          punctuationRef.current = !punctuationRef.current;
          setPunctuation((p) => !p);
          if (aiEnabled) flushAIBuffer();
          if (gameMode === "ai") preGenerateAIText();
          return;
        }
        if (key.name === "m") {
          setGameMode("multiplayer");
          setScreen("lobby");
          setRoundNumber(0);
          return;
        }
        const mode = MODE_HOTKEYS[key.name];
        if (mode) {
          if (mode === "ai" && !aiEnabled) return;
          if (mode !== gameMode) {
            setGameMode(mode);
            if (mode === "ai") preGenerateAIText();
          }
          return;
        }
      }

      if (session.isLoading || raceCountdown) return;

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
      if (multiplayerActive) {
        if (key.name === "b") {
          leaveMultiplayer();
          return;
        }
        if (key.name === "q") return quit();
        return;
      }
      if (key.name === "n") return startNextRound();
      if (key.name === "q") return quit();
      if (key.name === "p") return goToProfile();
    }

    if (screen === "profile") {
      if (key.name === "tab") { setScreen("typing"); return; }
      if (key.name === "f") return cycleProfileFilter();
      if (key.name === "n") return startNextRound();
      if (key.name === "q") return quit();
    }
  });

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexGrow: 1 }}>
        {screen === "lobby" && (
          <LobbyScreen lobbyState={multiplayer.lobbyState} playerName={playerName!} />
        )}
        {screen === "typing" && (
          <TypingScreen
            roundNumber={roundNumber}
            gameMode={gameMode}
            punctuation={punctuation}
            aiEnabled={aiEnabled}
            lines={session.lines}
            progress={config.timeLimitMs !== null ? stats.timeProgress : session.progress}
            wpm={stats.wpm}
            accuracy={stats.accuracy}
            elapsed={stats.elapsed}
            isActive={session.isActive}
            isLoading={session.isLoading}
            isMultiplayer={multiplayerActive}
            playerName={playerName}
            opponents={multiplayer.opponents}
            raceTextLength={multiplayer.raceText?.length}
            raceCountdown={raceCountdown}
          />
        )}
        {screen === "results" && currentResult && (
          <ResultsScreen
            result={currentResult}
            previousWpm={previousWpm}
            whisperText={whisperText}
            isNewPbWpm={isNewPbWpm}
            isNewPbAccuracy={isNewPbAccuracy}
            isMultiplayer={multiplayerActive}
            raceResults={multiplayer.raceResults}
          />
        )}
        {screen === "profile" && <ProfileScreen narrative={narrativeText} punctuationFilter={profileFilter} />}
      </box>
      <StatusBar screen={screen} isTypingActive={screen === "typing" && session.isActive} aiEnabled={aiEnabled} isMultiplayer={multiplayerActive} />
    </box>
  );
}
