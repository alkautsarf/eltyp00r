import { useState, useRef, useCallback, useEffect } from "react";
import { MultiplayerClient } from "../lib/multiplayer";
import type { OpponentState, LobbyState, RaceResult } from "../types";

interface UseMultiplayerOptions {
  playerName: string;
  serverUrl?: string;
}

export function useMultiplayer({ playerName, serverUrl }: UseMultiplayerOptions) {
  const clientRef = useRef<MultiplayerClient | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState>({ phase: "idle" });
  const [opponents, setOpponents] = useState<OpponentState[]>([]);
  const [raceText, setRaceText] = useState<string | null>(null);
  const [raceResults, setRaceResults] = useState<RaceResult[] | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new MultiplayerClient(serverUrl, playerName);
    }
    return clientRef.current;
  }, [serverUrl, playerName]);

  // Subscribe to events
  useEffect(() => {
    const client = getClient();

    const onRoomCreated = (data: { code: string; playerId: string; isHost?: boolean }) => {
      playerIdRef.current = data.playerId;
      setPlayerId(data.playerId);
      setLobbyState({ phase: "waiting", code: data.code, players: [], isHost: !!data.isHost, punctuation: false });
    };

    const onLobby = (data: { players: Array<{ id: string; name: string }>; punctuation?: boolean }) => {
      setOpponents(
        data.players
          .filter((p) => p.id !== playerIdRef.current)
          .map((p) => ({ playerId: p.id, name: p.name, cursor: 0, wpm: 0, finished: false }))
      );
      setLobbyState((prev) => {
        if (prev.phase !== "waiting") return prev;
        return { ...prev, players: data.players, punctuation: data.punctuation ?? prev.punctuation };
      });
    };

    const onRaceStart = (data: { text: string }) => {
      setRaceText(data.text);
      setRaceResults(null);
      setOpponents((prev) => prev.map((o) => ({ ...o, cursor: 0, wpm: 0, finished: false, result: undefined })));
    };

    const onOpponentProgress = (data: { playerId: string; cursor: number; wpm: number }) => {
      setOpponents((prev) => {
        const idx = prev.findIndex((o) => o.playerId === data.playerId);
        if (idx === -1) return prev;
        const o = prev[idx];
        if (o.cursor === data.cursor && o.wpm === data.wpm) return prev;
        const next = [...prev];
        next[idx] = { ...o, cursor: data.cursor, wpm: data.wpm };
        return next;
      });
    };

    const onOpponentFinish = (data: { playerId: string; wpm: number; accuracy: number; duration: number }) => {
      setOpponents((prev) =>
        prev.map((o) =>
          o.playerId === data.playerId
            ? { ...o, finished: true, result: { wpm: data.wpm, accuracy: data.accuracy, duration: data.duration } }
            : o
        )
      );
    };

    const onRaceEnd = (data: { results: RaceResult[] }) => {
      setRaceResults(data.results);
      setRaceText(null);
      setLobbyState({ phase: "idle" });
    };

    const onPlayerLeft = (data: { playerId: string; name: string }) => {
      setOpponents((prev) => prev.filter((o) => o.playerId !== data.playerId));
    };

    const onHostTransfer = () => {
      setLobbyState((prev) => {
        if (prev.phase !== "waiting") return prev;
        return { ...prev, isHost: true };
      });
    };

    const onError = (data: { message: string }) => {
      setLobbyState({ phase: "error", message: data.message });
    };

    const onDisconnected = () => {
      // Only set error if we were in an active state
      setLobbyState((prev) => {
        if (prev.phase === "idle") return prev;
        return { phase: "error", message: "Disconnected from server" };
      });
    };

    client.on("room_created", onRoomCreated);
    client.on("lobby", onLobby);
    client.on("race_start", onRaceStart);
    client.on("opponent_progress", onOpponentProgress);
    client.on("opponent_finish", onOpponentFinish);
    client.on("race_end", onRaceEnd);
    client.on("player_left", onPlayerLeft);
    client.on("host_transfer", onHostTransfer);
    client.on("error", onError);
    client.on("disconnected", onDisconnected);

    return () => {
      client.off("room_created", onRoomCreated);
      client.off("lobby", onLobby);
      client.off("race_start", onRaceStart);
      client.off("opponent_progress", onOpponentProgress);
      client.off("opponent_finish", onOpponentFinish);
      client.off("race_end", onRaceEnd);
      client.off("player_left", onPlayerLeft);
      client.off("host_transfer", onHostTransfer);
      client.off("error", onError);
      client.off("disconnected", onDisconnected);
    };
  }, [getClient]);

  const createRoom = useCallback(() => {
    setLobbyState({ phase: "creating" });
    getClient().createRoom().catch(() => {
      setLobbyState({ phase: "error", message: "Failed to create room" });
    });
  }, [getClient]);

  const joinRoom = useCallback((code: string) => {
    setLobbyState({ phase: "creating" });
    getClient().joinRoom(code);
  }, [getClient]);

  const startJoining = useCallback(() => {
    setLobbyState({ phase: "joining", codeInput: "" });
  }, []);

  const updateCodeInput = useCallback((codeInput: string) => {
    setLobbyState({ phase: "joining", codeInput });
  }, []);

  const dismissError = useCallback(() => {
    setLobbyState({ phase: "idle" });
  }, []);

  const startGame = useCallback(() => {
    clientRef.current?.sendStart();
  }, []);

  const togglePunctuation = useCallback(() => {
    clientRef.current?.sendSetPunctuation(
      !(lobbyState.phase === "waiting" && lobbyState.punctuation)
    );
  }, [lobbyState]);

  const sendProgress = useCallback((cursor: number, wpm: number) => {
    clientRef.current?.sendProgress(cursor, wpm);
  }, []);

  const sendFinish = useCallback((wpm: number, accuracy: number, duration: number, errorCount: number, charCount: number) => {
    clientRef.current?.sendFinish(wpm, accuracy, duration, errorCount, charCount);
  }, []);

  const leave = useCallback(() => {
    clientRef.current?.leave();
    clientRef.current = null;
    setLobbyState({ phase: "idle" });
    setOpponents([]);
    setRaceText(null);
    setRaceResults(null);
    setPlayerId(null);
  }, []);

  return {
    lobbyState,
    opponents,
    raceText,
    raceResults,
    playerId,
    createRoom,
    joinRoom,
    startJoining,
    updateCodeInput,
    dismissError,
    startGame,
    togglePunctuation,
    sendProgress,
    sendFinish,
    leave,
  };
}
