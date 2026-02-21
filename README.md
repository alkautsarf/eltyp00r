# eltyp00r

Terminal typing trainer with adaptive difficulty and AI coaching. Built with [OpenTUI](https://github.com/anthropics/opentui) + React + Bun.

## Features

- **Adaptive word selection** -- Tracks per-key accuracy across sessions and biases word generation toward your weak keys
- **keybr-style typing model** -- Sticky cursor that doesn't advance on errors, forcing you to hit the correct key before moving on
- **AI coaching** -- Post-round whispers and profile narratives powered by Claude, with a knowledge base that accumulates across sessions
- **Per-key accuracy tracking** -- A-Z breakdown with color-coded accuracy grid
- **Personal bests** -- Tracks and notifies you when you hit a new PB for WPM or accuracy
- **Persistent stats** -- SQLite database stores all sessions, keystroke logs, and trends at `~/.eltyp00r/data.db`

## Screens

**Typing** -- Live WPM, accuracy, timer, and progress bar. White text turns dim as you type, red marks keys you struggled with.

**Results** -- WPM with delta from last round, accuracy, error count, problem keys, and an AI coaching nudge.

**Profile** -- Aggregate stats, WPM sparkline trend, per-key accuracy grid, personal bests, and an AI progress narrative.

## Install

```bash
bun install
```

## Usage

```bash
bun run src/index.tsx
```

Or create an alias:

```bash
# Add to ~/.local/bin/elt
#!/bin/bash
ELT_DIR="$HOME/Documents/eltyp00r"
exec bun run "$ELT_DIR/src/index.tsx" "$@"
```

## Keybindings

| Screen  | Key   | Action         |
|---------|-------|----------------|
| Typing  | tab   | Go to profile  |
| Typing  | esc   | Quit           |
| Results | n     | Next round     |
| Results | q     | Quit           |
| Results | p     | Go to profile  |
| Profile | tab   | Back to typing |
| Profile | n     | New round      |
| Profile | q     | Quit           |

## Stack

- [Bun](https://bun.sh) -- Runtime + SQLite
- [OpenTUI](https://github.com/anthropics/opentui) -- Terminal UI framework
- [React](https://react.dev) -- Component model via OpenTUI's React reconciler
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) -- AI coaching
