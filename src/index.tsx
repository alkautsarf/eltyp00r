import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app";
import pkg from "../package.json";

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  console.log(`eltyp00r v${pkg.version}`);
  process.exit(0);
}

const renderer = await createCliRenderer({ exitOnCtrlC: false });
createRoot(renderer).render(<App />);
