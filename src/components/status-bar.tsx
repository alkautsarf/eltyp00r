import { theme } from "../theme";
import type { Screen } from "../types";

interface StatusBarProps {
  screen: Screen;
  isTypingActive?: boolean;
  aiEnabled?: boolean;
  isMultiplayer?: boolean;
}

export function StatusBar({ screen, isTypingActive, aiEnabled, isMultiplayer }: StatusBarProps) {
  const modeRange = aiEnabled ? "1-5" : "1-4";
  const hints: Record<Screen, string> = {
    typing: isMultiplayer
      ? "esc quit"
      : `${modeRange} mode  m 1v1  \` punct  tab profile  esc quit`,
    results: isMultiplayer
      ? "n rematch  b solo  esc quit"
      : "n next  q quit  p profile",
    profile: "tab back  f filter  n new round  q quit",
    lobby: "c create  j join  esc back",
  };
  const hint = screen === "typing" && isTypingActive
    ? isMultiplayer ? "esc quit" : "tab restart  esc quit"
    : hints[screen];

  return (
    <box
      style={{
        height: 1,
        flexDirection: "row",
        gap: 2,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      <text fg={theme.fgDim}>{hint}</text>
      <box style={{ flexGrow: 1 }} />
      <text fg={theme.fgDim}>eltyp00r</text>
    </box>
  );
}
