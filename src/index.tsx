import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app";
import { initAI } from "./lib/ai";
import pkg from "../package.json";

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  console.log(`eltyp00r v${pkg.version}`);
  process.exit(0);
}

const noAi = process.argv.includes("--no-ai");
const aiEnabled = !noAi && initAI();

const nameIdx = process.argv.indexOf("--name");
const playerName = nameIdx !== -1 && process.argv[nameIdx + 1]
  ? process.argv[nameIdx + 1]
  : `guest_${Math.random().toString(36).slice(2, 6)}`;

const serverIdx = process.argv.indexOf("--server");
const serverUrl = serverIdx !== -1 && process.argv[serverIdx + 1]
  ? process.argv[serverIdx + 1]
  : undefined;

const renderer = await createCliRenderer({ exitOnCtrlC: false });
createRoot(renderer).render(<App aiEnabled={aiEnabled} playerName={playerName} serverUrl={serverUrl} />);
