import { theme } from "../theme";
import type { TypedLine } from "../types";

interface TypingScreenProps {
  roundNumber: number;
  lines: TypedLine[];
  progress: number;
  wpm: number;
  accuracy: number;
  elapsed: string;
}

export function TypingScreen({
  roundNumber,
  lines,
  progress,
  wpm,
  accuracy,
  elapsed,
}: TypingScreenProps) {
  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      {/* Top stats bar — centered */}
      <box
        style={{
          height: 1,
          flexDirection: "row",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <text>
          <span fg={theme.fgFaint}>round </span>
          <span fg={theme.blue}>#{roundNumber}</span>
        </text>
        <text fg={theme.fgFaint}>{elapsed}</text>
        <text>
          <span fg={theme.green}>{wpm}</span>
          <span fg={theme.fgFaint}> wpm</span>
        </text>
        <text>
          <span fg={theme.cyan}>{accuracy}</span>
          <span fg={theme.fgFaint}>%</span>
        </text>
      </box>

      {/* Progress bar — centered */}
      <box style={{ height: 1, flexDirection: "row", justifyContent: "center" }}>
        <ProgressBar percent={progress} />
      </box>

      {/* Typing area — vertically and horizontally centered */}
      <box
        style={{
          flexGrow: 1,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <box
          style={{
            flexDirection: "column",
            gap: 0,
          }}
        >
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
          case "typed":
            return (
              <span key={i} fg={theme.fgDim}>
                {g.text}
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
      <span fg={theme.fgFaint}> {percent}%</span>
    </text>
  );
}
