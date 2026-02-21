import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { RoundResult } from "../types";

const MODEL = "claude-opus-4-6";

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
let currentResolver: ((text: string) => void) | null = null;
let sessionAlive = false;
let activeStream: ReturnType<typeof query> | null = null;

async function* messageGenerator(): AsyncGenerator<SDKUserMessage> {
  while (true) {
    const item = await messageQueue.pull();
    currentResolver = item.resolve;
    yield {
      type: "user" as const,
      message: { role: "user" as const, content: item.prompt },
      parent_tool_use_id: null,
      session_id: "",
    };
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
    },
  });

  const stream = activeStream;

  // Consume stream in background
  (async () => {
    try {
      for await (const msg of stream as AsyncIterable<SDKMessage>) {
        if (msg.type === "result" && msg.subtype === "success" && currentResolver) {
          const text = ((msg.result as string) || "").replace(/^\n+/, "").trim();
          currentResolver(text);
          currentResolver = null;
        } else if (msg.type === "result" && currentResolver) {
          // Error result — resolve with empty string
          currentResolver("");
          currentResolver = null;
        }
      }
    } catch {
      // Session died
    } finally {
      sessionAlive = false;
      // Resolve any pending query so it doesn't hang
      if (currentResolver) {
        currentResolver("");
        currentResolver = null;
      }
    }
  })();
}

// Start session on module load (warm-up during app startup)
startSession();

async function sendQuery(prompt: string): Promise<string> {
  // If session died, restart it
  if (!sessionAlive) {
    startSession();
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
  const prompt = `Round stats: ${result.wpm} WPM, ${result.accuracy}% accuracy, ${result.errorCount} errors out of ${result.charCount} chars.
Problem keys: ${result.problemKeys.length > 0 ? result.problemKeys.join(", ") : "none"}.
${kbContext ? `Historical context:\n${kbContext}` : "No previous data."}

Give ONE sentence of coaching advice (15-30 words). Focus on the most impactful thing to improve next round. No preamble, just the sentence.`;

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
