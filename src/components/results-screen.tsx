import { theme } from "../theme";
import type { RoundResult, RaceResult } from "../types";
import { GAME_MODE_CONFIGS } from "../lib/game-modes";

interface ResultsScreenProps {
  result: RoundResult;
  previousWpm: number | null;
  whisperText?: string | null;
  isNewPbWpm?: boolean;
  isNewPbAccuracy?: boolean;
  isMultiplayer?: boolean;
  raceResults?: RaceResult[] | null;
}

function getHeaderText(config: { label: string; timeLimitMs: number | null }, isWarmup: boolean): string {
  if (isWarmup) return "Warm-Up Complete";
  if (config.timeLimitMs !== null) return `${config.label} Complete`;
  return "Round Complete";
}

function getDeltaColor(delta: number): string {
  if (delta > 0) return theme.green;
  if (delta < 0) return theme.orange;
  return theme.fgFaint;
}

export function ResultsScreen({ result, previousWpm, whisperText, isNewPbWpm, isNewPbAccuracy, isMultiplayer, raceResults }: ResultsScreenProps) {
  const config = GAME_MODE_CONFIGS[result.gameMode];
  const isWarmup = result.gameMode === "warmup";
  const delta = previousWpm !== null ? result.wpm - previousWpm : null;
  const keyAccuracyMap = new Map(result.keyAccuracies.map((ka) => [ka.key, ka]));
  const durationSecs = Math.round(result.duration / 1000);
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <box
      style={{
        flexDirection: "column",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <box style={{ flexDirection: "column", alignItems: "center" }}>
      {/* Header */}
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0 }}>
        <text fg={isWarmup ? theme.yellow : theme.fgFaint}>
          {getHeaderText(config, isWarmup)}
        </text>
        <text />
        <text fg={!isWarmup && isNewPbWpm ? theme.yellow : theme.cyan}>
          <b>{result.wpm}</b>
        </text>
        <text fg={theme.fgFaint}>wpm</text>
        {!isWarmup && isNewPbWpm && (
          <text fg={theme.yellow}>New Personal Best!</text>
        )}
        {delta !== null && !isNewPbWpm && (
          <text fg={getDeltaColor(delta)}>
            {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} from last
          </text>
        )}
      </box>

      <text />

      {/* Stats grid */}
      <box style={{ flexDirection: "row", gap: 4, justifyContent: "center" }}>
        <box style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgFaint}>accuracy</text>
          <text fg={!isWarmup && isNewPbAccuracy ? theme.yellow : theme.cyan}>
            {result.accuracy}%{!isWarmup && isNewPbAccuracy ? " PB" : ""}
          </text>
        </box>
        <box style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgFaint}>chars</text>
          <text fg={theme.fg}>{result.charCount}</text>
        </box>
        <box style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgFaint}>errors</text>
          <text fg={result.errorCount > 0 ? theme.orange : theme.fg}>{result.errorCount}</text>
        </box>
        <box style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgFaint}>time</text>
          <text fg={theme.fg}>{timeStr}</text>
        </box>
      </box>

      <text />

      {/* Problem keys */}
      {result.problemKeys.length > 0 && (
        <box style={{ flexDirection: "column", alignItems: "center", gap: 0 }}>
          <text fg={theme.fgFaint}>Problem Keys</text>
          <box style={{ flexDirection: "row", gap: 1 }}>
            {result.problemKeys.map((key) => {
              const acc = keyAccuracyMap.get(key)?.accuracy ?? 0;
              const color = acc < 60 ? theme.red : theme.orange;
              return (
                <text key={key} fg={color}>
                  [{key.toUpperCase()} {acc}%]
                </text>
              );
            })}
          </box>
        </box>
      )}

      <text />

      {/* Race leaderboard */}
      {isMultiplayer && raceResults && (
        <box style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgFaint}>Race Results</text>
          {raceResults.map((r) => {
            const rankLabel = ["1st", "2nd", "3rd", "4th"][r.rank - 1] || `${r.rank}th`;
            const rankColor = r.rank === 1 ? theme.yellow : theme.fgFaint;
            const durationSec = Math.round(r.duration / 1000);
            const m = Math.floor(durationSec / 60);
            const s = durationSec % 60;
            return (
              <text key={r.playerId}>
                <span fg={rankColor}>{rankLabel.padEnd(3)}</span>
                <span fg={theme.fg}>{"  "}{r.name.padEnd(14).slice(0, 14)}</span>
                <span fg={theme.green}>{String(r.wpm).padStart(3)} wpm</span>
                <span fg={theme.cyan}>{"  "}{r.accuracy.toFixed(1).padStart(5)}%</span>
                <span fg={theme.fgFaint}>{"  "}{m}:{s.toString().padStart(2, "0")}</span>
              </text>
            );
          })}
        </box>
      )}

      {/* AI Whisper */}
      {!isMultiplayer && whisperText && (
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          <box
            style={{
              flexDirection: "column",
              paddingLeft: 2,
              paddingRight: 2,
            }}
            border
            borderColor={theme.border}
          >
            <text fg={theme.blue}>~ {whisperText}</text>
          </box>
        </box>
      )}

      {/* Actions */}
      <text />
      {isMultiplayer ? (
        <box style={{ flexDirection: "row", gap: 3, justifyContent: "center" }}>
          <text fg={theme.fgFaint}>Next round starting soon...</text>
          <text>
            <span fg={theme.yellow}>[b]</span>
            <span fg={theme.fgFaint}> back to solo</span>
          </text>
          <text>
            <span fg={theme.yellow}>[esc]</span>
            <span fg={theme.fgFaint}> quit</span>
          </text>
        </box>
      ) : (
        <box style={{ flexDirection: "row", gap: 3, justifyContent: "center" }}>
          <text>
            <span fg={theme.yellow}>[n]</span>
            <span fg={theme.fgFaint}> next round</span>
          </text>
          <text>
            <span fg={theme.yellow}>[q]</span>
            <span fg={theme.fgFaint}> quit</span>
          </text>
          <text>
            <span fg={theme.yellow}>[p]</span>
            <span fg={theme.fgFaint}> profile</span>
          </text>
        </box>
      )}
      </box>
    </box>
  );
}
