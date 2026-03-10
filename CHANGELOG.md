# Changelog

All notable changes to eltyp00r will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
