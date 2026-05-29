const FALLBACK_MODEL = "claude-opus-4-8";

/**
 * Resolve the Claude model to use.
 * Dynamic by design: to move to a new model on a future release, set an env var
 * (no code change). Precedence:
 *   1. ELTYP_MODEL  (this tool only)
 *   2. S0NDER_MODEL  (shared across all s0nderlabs tools)
 *   3. FALLBACK_MODEL  (safe default, currently claude-opus-4-8)
 */
export function resolveModel(): string {
  // Trim so a stray-whitespace env value (a trailing space in a shell profile,
  // a blank CI secret) is treated as unset and falls through to the fallback,
  // rather than being handed to the SDK as an invalid model id.
  return (
    process.env.ELTYP_MODEL?.trim() ||
    process.env.S0NDER_MODEL?.trim() ||
    FALLBACK_MODEL
  );
}
