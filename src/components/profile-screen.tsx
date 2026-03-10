import { theme } from "../theme";
import { getAggregateStats, getPersonalBests, getWpmTrend, getPerKeyAccuracy } from "../lib/db";
import type { KeyAccuracy } from "../types";

interface ProfileScreenProps {
  narrative: string | null;
  punctuationFilter?: boolean;
}

export function ProfileScreen({ narrative, punctuationFilter }: ProfileScreenProps) {
  const stats = getAggregateStats(punctuationFilter);
  const bests = getPersonalBests(punctuationFilter);
  const wpmTrend = getWpmTrend(30, punctuationFilter);
  const keyAccuracies = getPerKeyAccuracy();

  const totalMins = Math.floor(stats.totalTime / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const filterLabel = punctuationFilter === undefined
    ? "all sessions"
    : punctuationFilter
      ? "punctuation only"
      : "no punctuation";

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
      <box style={{ flexDirection: "column", alignItems: "center" }}>
        {/* Title */}
        <text fg={theme.fg}>Your Typing DNA</text>
        <text fg={theme.fgDim}>{filterLabel} [f]</text>
        <text />

        {/* Stats + Bests row */}
        <box style={{ flexDirection: "row", gap: 3 }}>
          <box style={{ flexDirection: "column" }}>
            <text fg={theme.fgFaint}>Avg Wpm</text>
            <text>
              <span fg={theme.green}>{stats.avgWpm}</span>
              <span fg={theme.fgFaint}> wpm</span>
            </text>
          </box>
          <box style={{ flexDirection: "column" }}>
            <text fg={theme.fgFaint}>Accuracy</text>
            <text>
              <span fg={theme.cyan}>{stats.avgAccuracy}</span>
              <span fg={theme.fgFaint}>%</span>
            </text>
          </box>
          <box style={{ flexDirection: "column" }}>
            <text fg={theme.fgFaint}>Best Wpm</text>
            <text>
              <span fg={theme.yellow}>{bests.bestWpm}</span>
              <span fg={theme.fgFaint}> wpm</span>
            </text>
          </box>
          <box style={{ flexDirection: "column" }}>
            <text fg={theme.fgFaint}>Best Acc</text>
            <text>
              <span fg={theme.yellow}>{bests.bestAccuracy}</span>
              <span fg={theme.fgFaint}>%</span>
            </text>
          </box>
          <box style={{ flexDirection: "column" }}>
            <text fg={theme.fgFaint}>Sessions</text>
            <text fg={theme.fg}>{stats.totalSessions}</text>
          </box>
          <box style={{ flexDirection: "column" }}>
            <text fg={theme.fgFaint}>Time</text>
            <text fg={theme.fg}>{timeStr}</text>
          </box>
        </box>

        {/* WPM Trend */}
        {wpmTrend.length > 0 && (
          <box style={{ flexDirection: "column", paddingTop: 1 }}>
            <text fg={theme.fgFaint}>Wpm Trend</text>
            <text>
              <span fg={theme.green}>{sparkline(wpmTrend)}</span>
              <span fg={theme.fgFaint}>
                {" "}
                {wpmTrend[wpmTrend.length - 1]} wpm
              </span>
            </text>
          </box>
        )}

        {/* Per-key accuracy — compact grid */}
        {keyAccuracies.length > 0 && (
          <box style={{ flexDirection: "column", paddingTop: 1 }}>
            <text fg={theme.fgFaint}>Per-Key Accuracy</text>
            <KeyGrid keyAccuracies={keyAccuracies} showExtras={punctuationFilter !== false} />
          </box>
        )}

        {/* AI Coach */}
        {narrative && (
          <box
            style={{ flexDirection: "column", paddingLeft: 1, paddingRight: 1, marginTop: 1 }}
            border
            borderColor={theme.border}
          >
            <text fg={theme.fgFaint}>Claude Insight</text>
            <text fg={theme.blue}>{narrative}</text>
          </box>
        )}

        {stats.totalSessions === 0 && (
          <box style={{ paddingTop: 1 }}>
            <text fg={theme.fgFaint}>No sessions yet. Complete a round to see your stats.</text>
          </box>
        )}
      </box>
    </box>
  );
}

function sparkline(values: number[]): string {
  if (values.length === 0) return "";
  const blocks = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => blocks[Math.min(7, Math.round(((v - min) / range) * 7))]).join("");
}

function accuracyColor(accuracy: number): string {
  if (accuracy >= 90) return theme.green;
  if (accuracy >= 75) return theme.yellow;
  return theme.red;
}

const EXTRA_KEYS: { key: string; label: string }[] = [
  { key: ".", label: "." },
  { key: ",", label: "," },
  { key: "?", label: "?" },
  { key: "Shift", label: "Aa" },
];

function KeyGrid({ keyAccuracies, showExtras }: { keyAccuracies: KeyAccuracy[]; showExtras: boolean }) {
  const keyMap = new Map(keyAccuracies.map((ka) => [ka.key, ka]));
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const cols = 9;
  const rows: string[][] = [];

  for (let i = 0; i < letters.length; i += cols) {
    rows.push(letters.slice(i, i + cols));
  }

  const hasExtraData = showExtras && EXTRA_KEYS.some((ek) => keyMap.has(ek.key));

  return (
    <box style={{ flexDirection: "column", gap: 0 }}>
      {rows.map((row, rowIdx) => (
        <text key={rowIdx}>
          {row.map((letter) => {
            const ka = keyMap.get(letter);
            if (!ka) {
              return (
                <span key={letter} fg={theme.fgDim}>
                  {letter} --
                </span>
              );
            }
            const pct = ka.accuracy.toString().padStart(2, " ");
            return (
              <span key={letter} fg={accuracyColor(ka.accuracy)}>
                {letter} {pct}% {" "}
              </span>
            );
          })}
        </text>
      ))}
      {hasExtraData && (
        <text>
          {EXTRA_KEYS.map((ek) => {
            const ka = keyMap.get(ek.key);
            if (!ka) {
              return (
                <span key={ek.key} fg={theme.fgDim}>
                  {ek.label.padStart(2)} --
                </span>
              );
            }
            const pct = ka.accuracy.toString().padStart(2, " ");
            return (
              <span key={ek.key} fg={accuracyColor(ka.accuracy)}>
                {ek.label.padStart(2)} {pct}% {" "}
              </span>
            );
          })}
        </text>
      )}
    </box>
  );
}
