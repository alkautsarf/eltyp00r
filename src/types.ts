export type CharState = "upcoming" | "current" | "typed" | "error";

export interface TypedChar {
  char: string;
  state: CharState;
  hadError?: boolean;
}

export interface TypedLine {
  chars: TypedChar[];
}

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  isError: boolean;
  targetChar?: string;
}

export interface KeyAccuracy {
  key: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
}

export interface ProblemWord {
  word: string;
  errors: number;
}

export type GameMode = "normal" | "timed30" | "timed60" | "warmup" | "ai" | "multiplayer";

export interface RoundResult {
  roundNumber: number;
  gameMode: GameMode;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  duration: number;
  charCount: number;
  errorCount: number;
  wordCount: number;
  keystrokeLog: KeystrokeEvent[];
  keyAccuracies: KeyAccuracy[];
  problemKeys: string[];
  problemWords: ProblemWord[];
  punctuation: boolean;
  timestamp: Date;
}

export type Screen = "typing" | "results" | "profile" | "lobby";

export interface OpponentState {
  playerId: string;
  name: string;
  cursor: number;
  wpm: number;
  finished: boolean;
  result?: { wpm: number; accuracy: number; duration: number };
}

export type LobbyState =
  | { phase: "idle" }
  | { phase: "creating" }
  | { phase: "waiting"; code: string; players: Array<{ id: string; name: string }>; isHost: boolean; punctuation: boolean }
  | { phase: "joining"; codeInput: string }
  | { phase: "error"; message: string };

export interface RaceResult {
  playerId: string;
  name: string;
  wpm: number;
  accuracy: number;
  duration: number;
  rank: number;
}

export function classifyKey(char: string): string | null {
  if (char >= "A" && char <= "Z") return "Shift";
  if (char >= "a" && char <= "z") return char;
  if (char === "." || char === "," || char === "?") return char;
  return null;
}

export function computeKeyAccuracies(log: KeystrokeEvent[]): KeyAccuracy[] {
  const keyStats = new Map<string, { correct: number; incorrect: number }>();
  for (const event of log) {
    if (!event.targetChar) continue;
    const k = classifyKey(event.targetChar);
    if (!k) continue;
    if (!keyStats.has(k)) keyStats.set(k, { correct: 0, incorrect: 0 });
    const stat = keyStats.get(k)!;
    if (event.isError) stat.incorrect++;
    else stat.correct++;
  }
  return Array.from(keyStats.entries())
    .map(([key, { correct, incorrect }]) => ({
      key,
      correct,
      incorrect,
      total: correct + incorrect,
      accuracy: correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export interface GoalRow {
  id: string;
  type: string;
  target: number;
  current: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}
