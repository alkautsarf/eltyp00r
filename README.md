# eltyp00r

Terminal typing trainer with adaptive difficulty and AI coaching. Built with [OpenTUI](https://github.com/anthropics/opentui) + React + Bun.

## Features

- **Multiplayer** -- Real-time racing (up to 4 players) with room codes, host controls, punctuation toggle, and auto-continue
- **Game modes** -- Normal, timed 30s, timed 60s, warm-up (heavy weak-key bias), and Claude (AI-generated sentences targeting your weaknesses)
- **Adaptive word selection** -- Tracks per-key accuracy across sessions and biases word generation toward your weak keys
- **keybr-style typing model** -- Sticky cursor that doesn't advance on errors, forcing you to hit the correct key before moving on
- **Punctuation mode** -- Toggle capitalization and punctuation (periods, commas, question marks) across all modes
- **AI coaching** -- Post-round whispers and profile narratives powered by Claude, with a knowledge base that accumulates across sessions
- **Per-key accuracy tracking** -- A-Z breakdown with color-coded accuracy grid
- **Per-word error tracking** -- Results screen shows your most-missed words each round
- **Personal bests** -- Tracks and notifies you when you hit a new PB for WPM or accuracy
- **Persistent stats** -- SQLite database stores all sessions, keystroke logs, and trends at `~/.eltyp00r/data.db`

## Screens

**Typing** -- Live WPM, accuracy, timer, and progress bar. White text turns dim as you type, red marks keys you struggled with.

**Results** -- WPM with delta from last round, accuracy, error count, problem keys, problem words, and an AI coaching nudge.

**Profile** -- Aggregate stats, WPM sparkline trend, per-key accuracy grid, personal bests, and an AI progress narrative.

## Install

### Quick install (macOS / Linux)

```bash
curl -sfL https://raw.githubusercontent.com/alkautsarf/eltyp00r/main/install.sh | sh
```

### Homebrew (macOS / Linux)

```bash
brew tap alkautsarf/tap
brew install eltyp00r
```

### From source

```bash
git clone https://github.com/alkautsarf/eltyp00r.git
cd eltyp00r
bun install
bun run src/index.tsx
```

## Usage

```bash
eltyp00r                    # start with AI features enabled
eltyp00r --no-ai            # disable all AI features (no Claude auth required)
eltyp00r --name elpabl0     # set your multiplayer display name
```

## Keybindings

| Screen  | Key       | Action                  |
|---------|-----------|-------------------------|
| Typing  | 1-5       | Switch mode             |
| Typing  | 6         | Multiplayer lobby       |
| Typing  | `` ` ``   | Toggle punctuation      |
| Typing  | tab       | Go to profile / restart |
| Typing  | esc       | Quit                    |
| Lobby   | c         | Create room             |
| Lobby   | j         | Join room               |
| Lobby   | s         | Start race (host)       |
| Lobby   | `` ` ``   | Toggle punctuation (host)|
| Lobby   | esc       | Back                    |
| Results | n         | Next round              |
| Results | q         | Quit                    |
| Results | p / b     | Profile / back to solo  |
| Profile | tab       | Back to typing          |
| Profile | n         | New round               |
| Profile | q         | Quit                    |

## Stack

- [Bun](https://bun.sh) -- Runtime + SQLite
- [OpenTUI](https://github.com/anthropics/opentui) -- Terminal UI framework
- [React](https://react.dev) -- Component model via OpenTUI's React reconciler
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) -- AI coaching
