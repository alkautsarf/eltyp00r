import { theme } from "../theme";
import type { TypedLine, GameMode } from "../types";
import { GAME_MODE_CONFIGS, MODE_HOTKEYS } from "../lib/game-modes";

interface TypingScreenProps {
  roundNumber: number;
  gameMode: GameMode;
  lines: TypedLine[];
  progress: number;
  wpm: number;
  accuracy: number;
  elapsed: string;
  isActive: boolean;
}

export function TypingScreen({
  roundNumber,
  gameMode,
  lines,
  progress,
  wpm,
  accuracy,
  elapsed,
  isActive,
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
          {!isActive && Object.entries(MODE_HOTKEYS).map(([key, mode]) => (
            <text key={key}>
              <span fg={mode === gameMode ? theme.yellow : theme.fgDim}>
                {key} {GAME_MODE_CONFIGS[mode].label}
              </span>
            </text>
          ))}
        </box>

        <text />
        <text />
        <text />

        {/* Typing area */}
        <box style={{ flexDirection: "column", gap: 0 }}>
          {lines.map((line, lineIdx) => (
            <TextLine key={lineIdx} line={line} />
          ))}
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

function ProgressBar({ percent }: { percent: number }) {
  const width = 40;
  const filled = Math.round((width * percent) / 100);
  const empty = width - filled;

  return (
    <text>
      <span fg={theme.green}>{"█".repeat(filled)}</span>
      <span fg={theme.fgDim}>{"░".repeat(empty)}</span>
      <span fg={theme.fgFaint}> {percent.toString().padStart(3, " ")}%</span>
    </text>
  );
}
