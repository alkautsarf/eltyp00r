# Changelog

All notable changes to eltyp00r will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.6.2] - 2026-04-16

### Changed

- Upgraded `@anthropic-ai/claude-agent-sdk` from `^0.2.49` to `^0.2.111`

## [0.6.1] - 2026-04-16

### Changed

- Upgraded AI model from `claude-opus-4-6` to `claude-opus-4-7`

## [0.6.0] - 2026-03-28

### Added

- N-player multiplayer support (up to 4 players per room)
- Host controls: room creator starts the race and toggles settings
- Punctuation mode in multiplayer (host toggles with backtick, server generates punctuated text)
- Player list in lobby showing all connected players
- Host transfer when original host disconnects

### Changed

- Multiplayer hotkey changed from `m` to `6` (fixes conflict with typing text starting with 'm')
- Mode selector now shows `6 1v1` inline with other modes (1-5)
- Status bar uses brighter color for better visibility
- Results screen supports 1st/2nd/3rd/4th rank labels

## [0.5.1] - 2026-03-28

### Fixed

- Timer now starts when race text renders, not on first keypress (synchronized for both players)
- Race ends immediately when first player finishes instead of waiting for both
- Auto-continue to next round after 5s results display (no manual rematch needed)
- Round number skipping from 1 to 3 on first multiplayer race
- Mode selector showing during multiplayer countdown
- Premature lobby-to-typing transition causing desync between players

### Removed

- Lobby countdown screen (countdown now displays on typing screen with text visible)
- Manual rematch flow (replaced by auto-continue)

## [0.5.0] - 2026-03-28

### Added

- Real-time 1v1 multiplayer racing via WebSocket (press `m` to enter lobby)
- Lobby screen with room creation, code-based joining, and countdown
- Live opponent progress bars and WPM during races
- Side-by-side race results with ranked leaderboard
- Rematch flow after race completion
- `--name <name>` flag to set player display name
- `--server <url>` flag to override multiplayer server URL

## [0.4.3] - 2026-03-28

### Added

- Universal install script (`curl | sh`) for macOS and Linux
- Linux x64 support in Homebrew formula

## [0.4.2] - 2026-03-10

### Fixed

- Claude mode showing entire 1200-char batch as one round when punctuation is off (no sentence boundaries to split on)

## [0.4.1] - 2026-03-10

### Fixed

- Claude mode generating punctuation (periods, commas) even when punctuation toggle is off

## [0.4.0] - 2026-03-10

### Added

- Separate stats tracking for punctuation vs non-punctuation sessions (profile filter with `f` key)
- Per-key accuracy tracking for punctuation characters (`.` `,` `?`) and shift coordination (`Aa`)
- Batch AI sentence generation (10 rounds per API call) for near-zero loading in Claude mode
- All three Claude Insights fetched in a single API call for instant profile filter switching
- Punctuation mode context in whisper coaching

### Changed

- Personal bests now tracked separately per punctuation mode
- Profile screen shows filter indicator with `[f]` cycle hint
- Punctuation/shift accuracy row hidden in "no punctuation" profile view
- Shared `classifyKey` and `computeKeyAccuracies` utilities to deduplicate key analysis logic
- Cached key accuracies at round start to avoid DB calls during timed mode text extension

### Fixed

- AI text generation stalling after buffer drain (race condition with in-flight fetch guard)
- Stale narrative text persisting when switching to a filter with no sessions

## [0.3.3] - 2026-03-07

### Fixed

- AI features not working in compiled binary (resolve system claude binary for Homebrew installs)

## [0.3.2] - 2026-03-07

### Fixed

- AI narrative referencing stale WPM instead of current average (removed redundant typing_speed from KB context)
- WPM trend sparkline showing first 30 sessions instead of most recent 30

## [0.3.1] - 2026-02-23

### Added

- `--no-ai` flag to disable all AI features for offline use or when no Claude auth is configured

### Fixed

- App crashing on startup when no Claude OAuth token or API key is set

## [0.3.0] - 2026-02-23

### Added

- Claude mode (key 5): AI-generated typing sentences that adapt to your weak keys
- Punctuation/capitalization toggle (backtick key): adds periods, commas, question marks, and proper casing across all modes
- Per-word error tracking on results screen showing most-missed words
- Tab restart mid-typing resets the round without changing modes

### Fixed

- Whisper coaching not appearing after rounds (resolver race condition with persistent AI session)
- Tab restart not resetting WPM and accuracy stats
- Switching modes incorrectly incrementing round number
- Pressing the same mode key (e.g., 5 while in mode 5) starting the round
- Claude mode stuck on "generating..." after tab restart or punctuation toggle

## [0.2.2] - 2026-02-22

### Fixed

- Use British spelling "judgement" in word list

## [0.2.1] - 2026-02-22

### Changed

- Profile screen title capitalized to "Your Typing DNA"

## [0.2.0] - 2026-02-22

### Added

- Game modes: normal, timed 30s, timed 60s, and warm-up
- Mode selector (keys 1-4) shown before typing starts
- Countdown timer for timed modes with auto-complete on expiry
- Dynamic text extension in timed modes (never runs out of words)
- Warm-up mode targeting weakest keys with heavy bias
- Persistent AI session using streaming input (eliminates cold start on subsequent queries)
- Pre-fetch whisper coaching during round completion for faster display
- Cached narrative on profile screen (refreshes only after new rounds)
- Graceful AI session cleanup on quit

### Changed

- AI label renamed from "AI Coach" to "Claude Insight"
- All labels changed from uppercase to title case
- Stats bar values fixed-width to prevent layout shifts
- Header and text grouped as centered unit on typing screen
- Conditional DB persistence (warm-up rounds skip saves and PB checks)
- Profile screen uses synchronous data reads (no loading state)

## [0.1.3] - 2026-02-21

### Fixed

- Center results screen vertically and horizontally

## [0.1.2] - 2026-02-21

### Added

- `--version` / `-v` flag

## [0.1.1] - 2026-02-21

### Added

- Automated release pipeline via GitHub Actions

## [0.1.0] - 2026-02-21

### Added

- Core typing loop with keybr-style sticky cursor (no advance on error, no backspace)
- Adaptive word selection biased toward weak keys using per-key accuracy history
- Three screens: typing, results, profile
- Live WPM, accuracy, and timer during typing
- Progress bar showing round completion
- Post-round results with WPM delta, error count, and problem key badges
- Personal best tracking with notification on new PB
- Per-key accuracy grid (A-Z) on profile screen
- WPM sparkline trend chart on profile
- AI coaching whisper after each round (Claude-powered)
- AI narrative on profile screen analyzing overall progress
- Knowledge base that accumulates per-key stats across sessions
- Persistent SQLite storage at ~/.eltyp00r/data.db
- Tab key to toggle between typing and profile screens
- Homebrew distribution via `brew tap alkautsarf/tap`

[0.6.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.6.2
[0.6.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.6.1
[0.6.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.6.0
[0.5.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.5.1
[0.5.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.5.0
[0.4.3]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.4.3
[0.4.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.4.2
[0.4.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.4.1
[0.4.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.4.0
[0.3.3]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.3.3
[0.3.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.3.2
[0.3.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.3.1
[0.3.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.3.0
[0.2.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.2.2
[0.2.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.2.1
[0.2.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.2.0
[0.1.3]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.3
[0.1.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.2
[0.1.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.1
[0.1.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.0
