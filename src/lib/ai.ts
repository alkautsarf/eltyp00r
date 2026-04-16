import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { RoundResult } from "../types";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const MODEL = "claude-opus-4-7";

// In compiled binaries, import.meta.url points to $bunfs virtual filesystem
// where cli.js doesn't exist. Find the system claude binary instead.
const IS_COMPILED = import.meta.url.includes("$bunfs");

function findClaudeBinary(): string | null {
  const local = join(homedir(), ".local", "bin", "claude");
  if (existsSync(local)) return local;
  try {
    const found = execSync("which claude 2>/dev/null", { encoding: "utf8" }).trim();
    if (found && existsSync(found)) return found;
  } catch {}
  return null;
}

const claudeCodePath = IS_COMPILED ? findClaudeBinary() : undefined;

const SYSTEM_BASE = `You are a typing coach inside eltyp00r, a terminal typing trainer. Be concise, encouraging, and specific. Write like a human. Never use em-dashes or en-dashes. Never use markdown formatting (no **bold**, *italic*, headers, or lists). Output plain text only. Avoid AI jargon like "delve", "leverage", "seamless", "robust", "utilize", "cutting-edge". Use simple, natural, conversational language.`;

// --- Async queue for feeding messages to the persistent session ---

type QueueItem = { prompt: string; resolve: (text: string) => void };

class AsyncQueue<T> {
  private items: T[] = [];
  private waiter: ((item: T) => void) | null = null;

  push(item: T) {
    if (this.waiter) {
      const resolve = this.waiter;
      this.waiter = null;
      resolve(item);
    } else {
      this.items.push(item);
    }
  }

  pull(): Promise<T> {
    if (this.items.length > 0) return Promise.resolve(this.items.shift()!);
    return new Promise((resolve) => { this.waiter = resolve; });
  }
}

// --- Persistent streaming session ---

const messageQueue = new AsyncQueue<QueueItem>();
const resolverQueue: ((text: string) => void)[] = [];
let sessionAlive = false;
let activeStream: ReturnType<typeof query> | null = null;

async function* messageGenerator(): AsyncGenerator<SDKUserMessage> {
  while (true) {
    const item = await messageQueue.pull();
    resolverQueue.push(item.resolve);
    yield {
      type: "user",
      message: { role: "user", content: item.prompt },
      parent_tool_use_id: null,
      session_id: "",
    } as SDKUserMessage;
  }
}

function startSession() {
  sessionAlive = true;

  activeStream = query({
    prompt: messageGenerator(),
    options: {
      model: MODEL,
      systemPrompt: SYSTEM_BASE,
      tools: [],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      effort: "low",
      persistSession: false,
      ...(claudeCodePath ? { pathToClaudeCodeExecutable: claudeCodePath } : {}),
    },
  });

  const stream = activeStream;

  // Consume stream in background
  (async () => {
    try {
      for await (const msg of stream as AsyncIterable<SDKMessage>) {
        if (msg.type === "result" && resolverQueue.length > 0) {
          const resolve = resolverQueue.shift()!;
          if (msg.subtype === "success") {
            resolve(((msg.result as string) || "").replace(/^\n+/, "").trim());
          } else {
            resolve("");
          }
        }
      }
    } catch {
      // Session died
    } finally {
      sessionAlive = false;
      // Resolve any pending queries so they don't hang
      while (resolverQueue.length > 0) {
        resolverQueue.shift()!("");
      }
    }
  })();
}

let aiInitialized = false;

export function initAI(): boolean {
  if (IS_COMPILED && !claudeCodePath) return false;
  try {
    startSession();
    aiInitialized = true;
    return true;
  } catch {
    return false;
  }
}

async function sendQuery(prompt: string): Promise<string> {
  if (!aiInitialized) return "";
  if (!sessionAlive) {
    try { startSession(); } catch { return ""; }
  }
  return new Promise<string>((resolve) => {
    messageQueue.push({ prompt, resolve });
  });
}

export function closeAISession() {
  aiBuffer.length = 0;
  batchFetchPromise = null;
  if (activeStream) {
    activeStream.close();
    activeStream = null;
    sessionAlive = false;
  }
}

// --- AI sentence batch buffer ---

const aiBuffer: string[] = [];
let batchFetchPromise: Promise<void> | null = null;

function splitIntoChunks(text: string): string[] {
  // Try splitting by sentence boundaries first
  const sentences = text.match(/[^.!?]*[.!?]+\s*/g);

  if (sentences && sentences.length > 1) {
    // Greedily combine sentences into ~120-150 char chunks
    const chunks: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if (current.length === 0) {
        current = trimmed;
      } else if (current.length + 1 + trimmed.length <= 150) {
        current += " " + trimmed;
      } else {
        if (current.length >= 20) chunks.push(current);
        current = trimmed;
      }
    }
    if (current.length >= 20) chunks.push(current);
    return chunks;
  }

  // No sentence boundaries (e.g., no punctuation mode) — split by words into ~120 char chunks
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= 130) {
      current += " " + word;
    } else {
      if (current.length >= 20) chunks.push(current);
      current = word;
    }
  }
  if (current.length >= 20) chunks.push(current);
  return chunks;
}

function fetchBatch(kbContext: string, punctuation: boolean): Promise<void> {
  if (batchFetchPromise) return batchFetchPromise;

  batchFetchPromise = (async () => {
    try {
      const punctRules = punctuation
        ? "- Use only common punctuation (periods, commas)\n- Use proper capitalization (capitalize first letter of sentences)"
        : "- No punctuation at all (no periods, commas, or any punctuation marks)\n- All lowercase";

      const prompt = `Generate 20-30 natural English sentences for typing practice, approximately 1200 characters total.
${kbContext ? `The typist struggles with these patterns:\n${kbContext}\n\nIncorporate their problem keys and problem words naturally into the sentences.` : "Generate varied, natural sentences."}

Rules:
- Output ONLY the sentences, nothing else
${punctRules}
- No quotes, no special characters
- Natural sounding, not contrived
- Target approximately 1200 characters total`;

      const text = await sendQuery(prompt);
      if (text && text.length >= 60) {
        const chunks = splitIntoChunks(text);
        aiBuffer.push(...chunks);
      }
    } finally {
      batchFetchPromise = null;
    }
  })();

  return batchFetchPromise;
}

export function flushAIBuffer(): void {
  aiBuffer.length = 0;
  batchFetchPromise = null;
}

// --- Public API ---

export async function getWhisper(result: RoundResult, kbContext: string): Promise<string> {
  const problemWordStr = result.problemWords.length > 0
    ? `Problem words this round: ${result.problemWords.slice(0, 10).map((pw) => `"${pw.word}" (${pw.errors} errors)`).join(", ")}.`
    : "";

  const prompt = `Round stats: ${result.wpm} WPM, ${result.accuracy}% accuracy, ${result.errorCount} errors out of ${result.charCount} chars.${result.punctuation ? " (punctuation mode)" : ""}
Problem keys: ${result.problemKeys.length > 0 ? result.problemKeys.join(", ") : "none"}.
${problemWordStr}
${kbContext ? `Historical context:\n${kbContext}` : "No previous data."}

Give ONE sentence of coaching advice (15-30 words). Focus on the most impactful thing to improve next round. No preamble, just the sentence.`;

  return sendQuery(prompt);
}

export async function generateAISentences(kbContext: string, punctuation: boolean = false): Promise<string> {
  // Serve from buffer if available
  if (aiBuffer.length > 0) {
    const chunk = aiBuffer.shift()!;

    // Background refetch when buffer is running low
    if (aiBuffer.length <= 2) {
      fetchBatch(kbContext, punctuation).catch(() => {});
    }

    return chunk;
  }

  // Buffer empty: fetch a new batch and return the first chunk
  await fetchBatch(kbContext, punctuation);

  if (aiBuffer.length > 0) {
    return aiBuffer.shift()!;
  }

  return "";
}

export async function getNarrative(
  aggregateStats: { avgWpm: number; avgAccuracy: number; totalSessions: number; totalTime: number },
  kbContext: string,
  filterLabel?: string
): Promise<string> {
  const totalMins = Math.round(aggregateStats.totalTime / 60000);

  const prompt = `User typing profile${filterLabel ? ` (${filterLabel})` : ""}:
- Average WPM: ${aggregateStats.avgWpm}
- Average accuracy: ${aggregateStats.avgAccuracy}%
- Total sessions: ${aggregateStats.totalSessions}
- Total practice time: ${totalMins} minutes
${kbContext ? `\nHistorical data:\n${kbContext}` : ""}

Write 2-3 sentences analyzing their typing progress. Be specific about what's working and what to focus on. End with one actionable suggestion. No preamble.`;

  return sendQuery(prompt);
}

type StatsInput = { avgWpm: number; avgAccuracy: number; totalSessions: number; totalTime: number };

function formatStats(label: string, s: StatsInput): string {
  const mins = Math.round(s.totalTime / 60000);
  return `${label}: ${s.avgWpm} avg WPM, ${s.avgAccuracy}% accuracy, ${s.totalSessions} sessions, ${mins}min practice`;
}

export async function getAllNarratives(
  allStats: StatsInput | null,
  noPunctStats: StatsInput | null,
  punctStats: StatsInput | null,
  kbContext: string
): Promise<{ all?: string; noPunct?: string; punct?: string }> {
  const sections: string[] = [];
  if (allStats && allStats.totalSessions >= 3) sections.push(formatStats("All sessions", allStats));
  if (noPunctStats && noPunctStats.totalSessions >= 3) sections.push(formatStats("Non-punctuation sessions", noPunctStats));
  if (punctStats && punctStats.totalSessions >= 3) sections.push(formatStats("Punctuation sessions", punctStats));

  if (sections.length === 0) return {};

  const prompt = `User typing profile with multiple views:
${sections.join("\n")}
${kbContext ? `\nHistorical data:\n${kbContext}` : ""}

For EACH view listed above, write 2-3 sentences analyzing their typing in that mode. Be specific about what's working and what to focus on. End each with one actionable suggestion.

Format your response EXACTLY like this (include the markers):
${allStats && allStats.totalSessions >= 3 ? "[ALL]\n<insight for all sessions>\n" : ""}${noPunctStats && noPunctStats.totalSessions >= 3 ? "[NO_PUNCT]\n<insight for non-punctuation>\n" : ""}${punctStats && punctStats.totalSessions >= 3 ? "[PUNCT]\n<insight for punctuation>" : ""}

No preamble before the first marker. Just the markers and insights.`;

  const text = await sendQuery(prompt);
  if (!text) return {};

  const result: { all?: string; noPunct?: string; punct?: string } = {};
  const markerMap: Record<string, keyof typeof result> = { ALL: "all", NO_PUNCT: "noPunct", PUNCT: "punct" };

  // Split by markers in a single pass — order-independent
  const parts = text.split(/\[(ALL|NO_PUNCT|PUNCT)\]\s*/);
  // parts alternates: [preamble, marker, content, marker, content, ...]
  for (let i = 1; i < parts.length - 1; i += 2) {
    const key = markerMap[parts[i]];
    const content = parts[i + 1]?.trim();
    if (key && content) result[key] = content;
  }

  return result;
}
