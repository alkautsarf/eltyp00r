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

export type GameMode = "normal" | "timed30" | "timed60" | "warmup";

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
  timestamp: Date;
}

export type Screen = "typing" | "results" | "profile";

export interface GoalRow {
  id: string;
  type: string;
  target: number;
  current: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}
