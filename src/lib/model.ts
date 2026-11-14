const FALLBACK_MODEL = "claude-opus-5-5";

/**
 * Resolve the Claude model to use.
 * Env vars override the model per user with no code change; bumping the shipped
 * default means editing FALLBACK_MODEL. Precedence:
 *   1. ELTYP_MODEL  (this tool only)
 *   2. S0NDER_MODEL  (shared across all s0nderlabs tools)
 *   3. FALLBACK_MODEL  (built-in safe default)
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
