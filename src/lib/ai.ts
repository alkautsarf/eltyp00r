import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { RoundResult } from "../types";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const MODEL = "claude-opus-4-6";

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
  if (activeStream) {
    activeStream.close();
    activeStream = null;
    sessionAlive = false;
  }
}

// --- Public API (unchanged signatures) ---

export async function getWhisper(result: RoundResult, kbContext: string): Promise<string> {
  const problemWordStr = result.problemWords.length > 0
    ? `Problem words this round: ${result.problemWords.slice(0, 10).map((pw) => `"${pw.word}" (${pw.errors} errors)`).join(", ")}.`
    : "";

  const prompt = `Round stats: ${result.wpm} WPM, ${result.accuracy}% accuracy, ${result.errorCount} errors out of ${result.charCount} chars.
Problem keys: ${result.problemKeys.length > 0 ? result.problemKeys.join(", ") : "none"}.
${problemWordStr}
${kbContext ? `Historical context:\n${kbContext}` : "No previous data."}

Give ONE sentence of coaching advice (15-30 words). Focus on the most impactful thing to improve next round. No preamble, just the sentence.`;

  return sendQuery(prompt);
}

export async function generateAISentences(kbContext: string, punctuation: boolean = false): Promise<string> {
  const casingRule = punctuation
    ? "- Use proper capitalization (capitalize first letter of sentences)"
    : "- All lowercase";

  const prompt = `Generate 2-3 natural English sentences for typing practice, approximately 120 characters total.
${kbContext ? `The typist struggles with these patterns:\n${kbContext}\n\nIncorporate their problem keys and problem words naturally into the sentences.` : "Generate varied, natural sentences."}

Rules:
- Output ONLY the sentences, nothing else
- Use only common punctuation (periods, commas)
${casingRule}
- No quotes, no special characters
- Natural sounding, not contrived
- Target approximately 120 characters total`;

  return sendQuery(prompt);
}

export async function getNarrative(
  aggregateStats: { avgWpm: number; avgAccuracy: number; totalSessions: number; totalTime: number },
  kbContext: string
): Promise<string> {
  const totalMins = Math.round(aggregateStats.totalTime / 60000);

  const prompt = `User typing profile:
- Average WPM: ${aggregateStats.avgWpm}
- Average accuracy: ${aggregateStats.avgAccuracy}%
- Total sessions: ${aggregateStats.totalSessions}
- Total practice time: ${totalMins} minutes
${kbContext ? `\nHistorical data:\n${kbContext}` : ""}

Write 2-3 sentences analyzing their typing progress. Be specific about what's working and what to focus on. End with one actionable suggestion. No preamble.`;

  return sendQuery(prompt);
}
