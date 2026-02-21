import { theme } from "../theme";
import type { RoundResult } from "../types";

interface ResultsScreenProps {
  result: RoundResult;
  previousWpm: number | null;
  whisperText?: string | null;
  isNewPbWpm?: boolean;
  isNewPbAccuracy?: boolean;
}

export function ResultsScreen({ result, previousWpm, whisperText, isNewPbWpm, isNewPbAccuracy }: ResultsScreenProps) {
  const delta = previousWpm !== null ? result.wpm - previousWpm : null;
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
        <text fg={theme.fgFaint}>ROUND COMPLETE</text>
        <text />
        <text fg={isNewPbWpm ? theme.yellow : theme.cyan}>
          <b>{result.wpm}</b>
        </text>
        <text fg={theme.fgFaint}>WPM</text>
        {isNewPbWpm && (
          <text fg={theme.yellow}>NEW PERSONAL BEST!</text>
        )}
        {delta !== null && !isNewPbWpm && (
          <text fg={delta > 0 ? theme.green : delta < 0 ? theme.orange : theme.fgFaint}>
            {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} from last
          </text>
        )}
      </box>

      <text />

      {/* Stats grid */}
      <box style={{ flexDirection: "row", gap: 4, justifyContent: "center" }}>
        <box style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgFaint}>accuracy</text>
          <text fg={isNewPbAccuracy ? theme.yellow : theme.cyan}>
            {result.accuracy}%{isNewPbAccuracy ? " PB" : ""}
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
          <text fg={theme.fgFaint}>PROBLEM KEYS</text>
          <box style={{ flexDirection: "row", gap: 1 }}>
            {result.problemKeys.map((key) => {
              const ka = result.keyAccuracies.find((k) => k.key === key);
              const acc = ka ? ka.accuracy : 0;
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

      {/* AI Whisper */}
      {whisperText && (
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
            <text>
              <span fg={theme.blue}>~ </span>
              <span fg={theme.blue}>{whisperText}</span>
            </text>
          </box>
        </box>
      )}

      {/* Actions */}
      <text />
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
      </box>
    </box>
  );
}
