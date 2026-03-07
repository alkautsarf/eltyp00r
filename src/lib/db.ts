import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { RoundResult, KeyAccuracy, GoalRow } from "../types";

const DATA_DIR = join(homedir(), ".eltyp00r");
const DB_PATH = join(DATA_DIR, "data.db");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    wpm REAL NOT NULL,
    raw_wpm REAL NOT NULL,
    accuracy REAL NOT NULL,
    duration INTEGER NOT NULL,
    char_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    keystroke_log TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS kb (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(category, key)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    target REAL NOT NULL,
    current REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );
`);

export function saveSession(result: RoundResult): string {
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO sessions (id, wpm, raw_wpm, accuracy, duration, char_count, error_count, word_count, keystroke_log)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      result.wpm,
      result.rawWpm,
      result.accuracy,
      result.duration,
      result.charCount,
      result.errorCount,
      result.wordCount,
      JSON.stringify(result.keystrokeLog),
    ]
  );
  return id;
}

export function getAggregateStats(): {
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalTime: number;
} {
  const row = db
    .query(
      `SELECT
        COALESCE(AVG(wpm), 0) as avgWpm,
        COALESCE(AVG(accuracy), 0) as avgAccuracy,
        COUNT(*) as totalSessions,
        COALESCE(SUM(duration), 0) as totalTime
      FROM sessions`
    )
    .get() as any;
  return {
    avgWpm: Math.round(row.avgWpm * 10) / 10,
    avgAccuracy: Math.round(row.avgAccuracy * 10) / 10,
    totalSessions: row.totalSessions,
    totalTime: row.totalTime,
  };
}

export function getPersonalBests(): { bestWpm: number; bestAccuracy: number } {
  const row = db
    .query(
      `SELECT
        COALESCE(MAX(wpm), 0) as bestWpm,
        COALESCE(MAX(accuracy), 0) as bestAccuracy
      FROM sessions`
    )
    .get() as any;
  return {
    bestWpm: Math.round(row.bestWpm * 10) / 10,
    bestAccuracy: Math.round(row.bestAccuracy * 10) / 10,
  };
}

export function getWpmTrend(limit: number = 30): number[] {
  const rows = db
    .query("SELECT wpm FROM sessions ORDER BY created_at DESC LIMIT ?")
    .all(limit) as { wpm: number }[];
  return rows.map((r) => Math.round(r.wpm)).reverse();
}

export function getPerKeyAccuracy(): KeyAccuracy[] {
  const rows = db
    .query("SELECT keystroke_log FROM sessions ORDER BY created_at DESC LIMIT 50")
    .all() as { keystroke_log: string }[];

  const keyStats = new Map<string, { correct: number; incorrect: number }>();

  for (const row of rows) {
    try {
      const log = JSON.parse(row.keystroke_log) as Array<{
        key: string;
        isError: boolean;
        targetChar?: string;
      }>;
      for (const event of log) {
        if (event.key === "Backspace" || !event.targetChar) continue;
        const key = event.targetChar.toLowerCase();
        if (key.length !== 1 || key < "a" || key > "z") continue;

        if (!keyStats.has(key)) keyStats.set(key, { correct: 0, incorrect: 0 });
        const stat = keyStats.get(key)!;
        if (event.isError) stat.incorrect++;
        else stat.correct++;
      }
    } catch {
      continue;
    }
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

function getActiveGoals(): GoalRow[] {
  return db.query("SELECT * FROM goals WHERE status = 'active' ORDER BY created_at DESC").all() as GoalRow[];
}

export function updateGoalProgress(wpm: number, accuracy: number): void {
  const goals = getActiveGoals();
  for (const goal of goals) {
    let current = 0;
    if (goal.type === "wpm_target") {
      current = wpm;
    } else if (goal.type === "accuracy_target") {
      current = accuracy;
    } else if (goal.type === "session_count") {
      current = goal.current + 1;
    }

    if (current >= goal.target) {
      db.run(
        `UPDATE goals SET current = ?, status = 'completed', completed_at = datetime('now') WHERE id = ?`,
        [current, goal.id]
      );
    } else {
      db.run(`UPDATE goals SET current = ? WHERE id = ?`, [current, goal.id]);
    }
  }
}

export { db };
