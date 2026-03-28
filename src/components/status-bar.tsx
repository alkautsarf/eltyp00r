import { theme } from "../theme";
import type { Screen } from "../types";

interface StatusBarProps {
  screen: Screen;
  isTypingActive?: boolean;
  aiEnabled?: boolean;
  isMultiplayer?: boolean;
}

export function StatusBar({ screen, isTypingActive, aiEnabled, isMultiplayer }: StatusBarProps) {
  const hints: Record<Screen, string> = {
    typing: isMultiplayer
      ? "esc quit"
      : "1-6 mode  ` punct  tab profile  esc quit",
    results: isMultiplayer
      ? "b solo  esc quit"
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
      <text fg={theme.fgFaint}>{hint}</text>
      <box style={{ flexGrow: 1 }} />
      <text fg={theme.fgFaint}>eltyp00r</text>
    </box>
  );
}
