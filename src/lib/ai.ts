import { query } from "@anthropic-ai/claude-agent-sdk";
import type { RoundResult } from "../types";

const MODEL = "claude-opus-4-6";

const SYSTEM_BASE = `You are a typing coach inside eltyp00r, a terminal typing trainer. Be concise, encouraging, and specific. Write like a human. Never use em-dashes or en-dashes. Never use markdown formatting (no **bold**, *italic*, headers, or lists). Output plain text only. Avoid AI jargon like "delve", "leverage", "seamless", "robust", "utilize", "cutting-edge". Use simple, natural, conversational language.`;

async function aiQuery(prompt: string): Promise<string> {
  let fullText = "";

  try {
    for await (const msg of query({
      prompt,
      options: {
        model: MODEL,
        systemPrompt: SYSTEM_BASE,
        tools: [],
        maxTurns: 1,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        thinking: { type: "adaptive" },
        effort: "low",
      },
    })) {
      if (msg.type === "result" && msg.subtype === "success") {
        fullText = ((msg.result as string) || "").replace(/^\n+/, "").trim();
      }
    }
  } catch {
    return "";
  }

  return fullText;
}

export async function getWhisper(result: RoundResult, kbContext: string): Promise<string> {
  const prompt = `Round stats: ${result.wpm} WPM, ${result.accuracy}% accuracy, ${result.errorCount} errors out of ${result.charCount} chars.
Problem keys: ${result.problemKeys.length > 0 ? result.problemKeys.join(", ") : "none"}.
${kbContext ? `Historical context:\n${kbContext}` : "No previous data."}

Give ONE sentence of coaching advice (15-30 words). Focus on the most impactful thing to improve next round. No preamble, just the sentence.`;

  return aiQuery(prompt);
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

  return aiQuery(prompt);
}
