import { theme } from "../theme";
import type { TypedLine, GameMode, OpponentState } from "../types";
import { GAME_MODE_CONFIGS, MODE_HOTKEYS } from "../lib/game-modes";

interface TypingScreenProps {
  roundNumber: number;
  gameMode: GameMode;
  punctuation?: boolean;
  aiEnabled?: boolean;
  lines: TypedLine[];
  progress: number;
  wpm: number;
  accuracy: number;
  elapsed: string;
  isActive: boolean;
  isLoading?: boolean;
  isMultiplayer?: boolean;
  playerName?: string;
  opponents?: OpponentState[];
  raceTextLength?: number;
}

export function TypingScreen({
  roundNumber,
  gameMode,
  punctuation,
  aiEnabled,
  lines,
  progress,
  wpm,
  accuracy,
  elapsed,
  isActive,
  isLoading,
  isMultiplayer,
  playerName,
  opponents,
  raceTextLength,
}: TypingScreenProps) {
  const config = GAME_MODE_CONFIGS[gameMode];
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
        {/* Stats bar */}
        <box
          style={{
            height: 1,
            flexDirection: "row",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <text fg={theme.yellow}>{config.label}</text>
          <text>
            <span fg={theme.fgFaint}>round </span>
            <span fg={theme.blue}>#{roundNumber}</span>
          </text>
          <text fg={theme.fgFaint}>{elapsed}</text>
          <text>
            <span fg={theme.green}>{wpm.toString().padStart(3, " ")}</span>
            <span fg={theme.fgFaint}> wpm</span>
          </text>
          <text>
            <span fg={theme.cyan}>{accuracy.toFixed(1).padStart(5, " ")}</span>
            <span fg={theme.fgFaint}>%</span>
          </text>
        </box>

        {/* Progress bar */}
        <box style={{ height: 1, flexDirection: "row", justifyContent: "center" }}>
          <ProgressBar percent={progress} />
        </box>

        {/* Mode selector — visible before typing, invisible placeholder during */}
        <box style={{ height: 1, flexDirection: "row", justifyContent: "center", gap: 2 }}>
          {!isActive && (
            <>
              {Object.entries(MODE_HOTKEYS)
                .filter(([, mode]) => mode !== "ai" || aiEnabled)
                .map(([key, mode]) => (
                <text key={key}>
                  <span fg={mode === gameMode ? theme.yellow : theme.fgDim}>
                    {key} {GAME_MODE_CONFIGS[mode].label}
                  </span>
                </text>
              ))}
              <text>
                <span fg={punctuation ? theme.yellow : theme.fgDim}>` .Aa</span>
              </text>
            </>
          )}
        </box>

        <text />

        {/* Race progress bars */}
        {isMultiplayer && (
          <box style={{ flexDirection: "column", gap: 0 }}>
            {opponents?.map((opp) => {
              const oppProgress = raceTextLength ? Math.round((opp.cursor / raceTextLength) * 100) : 0;
              return (
                <box key={opp.playerId} style={{ flexDirection: "row", height: 1, justifyContent: "center", gap: 1 }}>
                  <text fg={theme.fgFaint}>{opp.name.padEnd(12).slice(0, 12)}</text>
                  <ProgressBar percent={oppProgress} color={theme.orange} finished={opp.finished} />
                  <text fg={theme.fgFaint}>{String(opp.wpm).padStart(3)} wpm</text>
                </box>
              );
            })}
            <box style={{ flexDirection: "row", height: 1, justifyContent: "center", gap: 1 }}>
              <text fg={theme.cyan}>{(playerName || "you").padEnd(12).slice(0, 12)}</text>
              <ProgressBar percent={progress} color={theme.green} finished={false} />
              <text fg={theme.green}>{String(wpm).padStart(3)} wpm</text>
            </box>
          </box>
        )}

        {!isMultiplayer && <text />}
        {!isMultiplayer && <text />}

        {/* Typing area */}
        <box style={{ flexDirection: "column", gap: 0 }}>
          {isLoading ? (
            <text fg={theme.fgDim}>generating...</text>
          ) : (
            lines.map((line, lineIdx) => (
              <TextLine key={lineIdx} line={line} />
            ))
          )}
        </box>
      </box>
    </box>
  );
}

function TextLine({ line }: { line: TypedLine }) {
  const groups: { state: string; text: string }[] = [];

  for (const ch of line.chars) {
    const isCurrent = ch.state === "current";
    const last = groups[groups.length - 1];

    if (last && last.state === ch.state && !isCurrent) {
      last.text += ch.char;
    } else {
      groups.push({ state: ch.state, text: ch.char });
    }
  }

  return (
    <text>
      {groups.map((g, i) => {
        switch (g.state) {
          case "upcoming":
            return (
              <span key={i} fg={theme.fg}>
                {g.text}
              </span>
            );
          case "current":
            return (
              <span key={i} fg={theme.fg}>
                <u>{g.text}</u>
              </span>
            );
          case "error":
            return (
              <span key={i} fg={theme.red}>
                {g.text}
              </span>
            );
          default:
            return (
              <span key={i} fg={theme.fgDim}>
                {g.text}
              </span>
            );
        }
      })}
    </text>
  );
}

function ProgressBar({ percent, width = 40, color = theme.green, finished }: { percent: number; width?: number; color?: string; finished?: boolean }) {
  const filled = Math.round((width * Math.min(percent, 100)) / 100);
  const empty = width - filled;

  return (
    <text>
      <span fg={color}>{"█".repeat(filled)}</span>
      <span fg={theme.fgDim}>{"░".repeat(empty)}</span>
      <span fg={theme.fgFaint}> {percent.toString().padStart(3)}%</span>
      {finished && <span fg={theme.green}> ✓</span>}
    </text>
  );
}
