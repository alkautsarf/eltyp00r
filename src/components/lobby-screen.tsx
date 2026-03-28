import { theme } from "../theme";
import type { LobbyState } from "../types";

interface LobbyScreenProps {
  lobbyState: LobbyState;
  playerName: string;
}

export function LobbyScreen({ lobbyState, playerName }: LobbyScreenProps) {
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
        <text fg={theme.fg}>eltyp00r</text>
        <text fg={theme.fgFaint}>multiplayer</text>
        <text />

        {lobbyState.phase === "idle" && (
          <>
            <text />
            <text>
              <span fg={theme.yellow}>[c]</span>
              <span fg={theme.fg}> Create room</span>
            </text>
            <text>
              <span fg={theme.yellow}>[j]</span>
              <span fg={theme.fg}> Join room</span>
            </text>
            <text />
            <text fg={theme.fgFaint}>[esc] back</text>
          </>
        )}

        {lobbyState.phase === "creating" && (
          <text fg={theme.fgFaint}>Creating room...</text>
        )}

        {lobbyState.phase === "waiting" && (
          <>
            <text fg={theme.fgFaint}>Room code</text>
            <text />
            <text fg={theme.yellow}>
              <b>  {lobbyState.code.split("").join(" ")}  </b>
            </text>
            <text />
            <text fg={theme.fgFaint}>Waiting for opponent...</text>
            <text />
            <text fg={theme.fgDim}>[esc] cancel</text>
          </>
        )}

        {lobbyState.phase === "joining" && (
          <>
            <text fg={theme.fgFaint}>Enter room code</text>
            <text />
            <CodeInput value={lobbyState.codeInput} />
            <text />
            <text fg={theme.fgDim}>[esc] cancel</text>
          </>
        )}

        {lobbyState.phase === "countdown" && (
          <>
            <text fg={theme.fgFaint}>
              {playerName}
              <span fg={theme.fgDim}>  vs  </span>
              {lobbyState.players.find((p) => p.name !== playerName)?.name || "opponent"}
            </text>
            <text />
            <text fg={theme.yellow}>
              <b>{lobbyState.value}</b>
            </text>
          </>
        )}

        {lobbyState.phase === "error" && (
          <>
            <text fg={theme.red}>{lobbyState.message}</text>
            <text />
            <text fg={theme.fgDim}>[esc] back</text>
          </>
        )}
      </box>
    </box>
  );
}

function CodeInput({ value }: { value: string }) {
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const char = value[i] || "_";
    const isFilled = i < value.length;
    const isCurrent = i === value.length;
    slots.push(
      <span key={i} fg={isFilled ? theme.yellow : isCurrent ? theme.fg : theme.fgDim}>
        {isCurrent ? <u>{char}</u> : char}
      </span>
    );
    if (i < 3) slots.push(<span key={`s${i}`} fg={theme.fgDim}> </span>);
  }

  return <text>{slots}</text>;
}
