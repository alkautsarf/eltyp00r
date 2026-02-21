# Changelog

All notable changes to eltyp00r will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

[0.1.3]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.3
[0.1.2]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.2
[0.1.1]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.1
[0.1.0]: https://github.com/alkautsarf/eltyp00r/releases/tag/v0.1.0
