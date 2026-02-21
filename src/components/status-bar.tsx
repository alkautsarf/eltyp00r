import { theme } from "../theme";
import type { Screen } from "../types";

const hints: Record<Screen, string> = {
  typing: "tab profile  esc quit",
  results: "n next  q quit  p profile",
  profile: "tab back  n new round  q quit",
};

interface StatusBarProps {
  screen: Screen;
}

export function StatusBar({ screen }: StatusBarProps) {
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
      <text fg={theme.fgDim}>{hints[screen]}</text>
      <box style={{ flexGrow: 1 }} />
      <text fg={theme.fgDim}>eltyp00r</text>
    </box>
  );
}
