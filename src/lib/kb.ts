import { db } from "./db";
import type { ProblemWord } from "../types";

function kbGet(category: string, key: string): any | null {
  const row = db
    .query("SELECT value FROM kb WHERE category = ? AND key = ?")
    .get(category, key) as { value: string } | null;
  return row ? JSON.parse(row.value) : null;
}

function kbSet(category: string, key: string, value: any): void {
  const id = crypto.randomUUID();
  const json = JSON.stringify(value);
  db.run(
    `INSERT INTO kb (id, category, key, value, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(category, key) DO UPDATE SET
       value = excluded.value,
       updated_at = datetime('now')`,
    [id, category, key, json]
  );
}

function kbMergeAverage(category: string, key: string, newValue: number, weight: number = 1): void {
  const existing = kbGet(category, key);
  if (existing && typeof existing === "object" && "avg" in existing) {
    const newCount = existing.count + weight;
    const newAvg = (existing.avg * existing.count + newValue * weight) / newCount;
    kbSet(category, key, { avg: Math.round(newAvg * 10) / 10, count: newCount, last: newValue });
  } else {
    kbSet(category, key, { avg: newValue, count: weight, last: newValue });
  }
}

export function getKBContext(): string {
  const rows = db
    .query("SELECT category, key, value FROM kb WHERE category != 'typing_speed' ORDER BY category, key")
    .all() as Array<{ category: string; key: string; value: string }>;
  if (rows.length === 0) return "";

  return rows.map((r) => `[${r.category}] ${r.key}: ${r.value}`).join("\n");
}

function mergeProblemWords(newWords: ProblemWord[]): void {
  const existing: ProblemWord[] = kbGet("patterns", "problem_words") || [];
  const map = new Map<string, number>();
  for (const pw of existing) map.set(pw.word, pw.errors);
  for (const pw of newWords) map.set(pw.word, (map.get(pw.word) || 0) + pw.errors);

  const merged = Array.from(map.entries())
    .map(([word, errors]) => ({ word, errors }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 50);

  kbSet("patterns", "problem_words", merged);
}

export function updateKBFromRound(result: {
  wpm: number;
  accuracy: number;
  problemKeys: string[];
  keyAccuracies: Array<{ key: string; accuracy: number }>;
  problemWords: ProblemWord[];
}): void {
  kbSet("key_accuracy", "per_key", result.keyAccuracies);
  if (result.problemKeys.length > 0) {
    kbSet("patterns", "problem_keys", result.problemKeys);
  }
  if (result.problemWords.length > 0) {
    mergeProblemWords(result.problemWords);
  }
}
