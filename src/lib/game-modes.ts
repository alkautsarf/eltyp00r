import type { GameMode } from "../types";

export interface GameModeConfig {
  label: string;
  targetChars: number;
  timeLimitMs: number | null;
  savesToDb: boolean;
  updatesKb: boolean;
  weakKeyBias: "standard" | "heavy";
}

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  normal: {
    label: "normal",
    targetChars: 100,
    timeLimitMs: null,
    savesToDb: true,
    updatesKb: true,
    weakKeyBias: "standard",
  },
  timed30: {
    label: "timed 30s",
    targetChars: 500,
    timeLimitMs: 30_000,
    savesToDb: true,
    updatesKb: true,
    weakKeyBias: "standard",
  },
  timed60: {
    label: "timed 60s",
    targetChars: 500,
    timeLimitMs: 60_000,
    savesToDb: true,
    updatesKb: true,
    weakKeyBias: "standard",
  },
  warmup: {
    label: "warm-up",
    targetChars: 50,
    timeLimitMs: null,
    savesToDb: false,
    updatesKb: false,
    weakKeyBias: "heavy",
  },
  ai: {
    label: "claude",
    targetChars: 120,
    timeLimitMs: null,
    savesToDb: true,
    updatesKb: true,
    weakKeyBias: "standard",
  },
};

export const MODE_HOTKEYS: Record<string, GameMode> = {
  "1": "normal",
  "2": "timed30",
  "3": "timed60",
  "4": "warmup",
  "5": "ai",
};
