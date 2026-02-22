# Changelog

All notable changes to eltyp00r will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

[0.2.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.2.2
[0.2.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.2.1
[0.2.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.2.0
[0.1.3]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.3
[0.1.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.2
[0.1.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.1
[0.1.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.0
