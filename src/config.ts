/**
 * Resolves a configuration value from command-line arguments or environment variables.
 *
 * The first matching `--name=value` or `--name value` argument takes precedence, followed by a
 * non-empty environment variable matching `name`, then its uppercase equivalent.
 * Empty command-line values are returned as-is; empty environment values are ignored.
 *
 * @param name - The configuration key used for the argument and environment lookup.
 * @param fallback - The value to return when no argument or non-empty environment value is found.
 * @returns The resolved value, or `undefined` when no value or fallback is available.
 */
function getConfigValue(name: string, fallback?: string): string | undefined {
  // Check command line args first (format: --name=value or --name value)
  const argIndex = process.argv.findIndex((arg) => arg.startsWith(`--${name}=`) || arg === `--${name}`);

  if (argIndex !== -1) {
    // --name=value format: return the value after the first "="
    const arg = process.argv[argIndex];
    if (arg && arg.includes("=")) {
      return arg.split("=")[1];
    }

    // --name value format: return next argument if it exists and isn't another flag
    const nextArg = process.argv[argIndex + 1];
    if (nextArg && !nextArg.startsWith("--")) {
      return nextArg;
    }
  }

  // Check environment variables
  if (process.env[name]) {
    return process.env[name];
  }
  if (process.env[name.toUpperCase()]) {
    return process.env[name.toUpperCase()];
  }

  return fallback;
}

// Per-project Data Export API token. Still supported for existing users; new users sign in with the login tool.
export const CLARITY_API_TOKEN = getConfigValue('clarity_api_token');

// Base URLs of the Clarity service and its MCP API.
export const CLARITY_BASE_URL = "https://clarity.microsoft.com";
export const CLARITY_MCP_API_BASE_URL = `${CLARITY_BASE_URL}/mcp`;
export const mcpApiUrl = (path: string): string => `${CLARITY_MCP_API_BASE_URL}${path}`;

// OAuth configurations & constants.
// The client id is a public identifier, not a secret;
// it must match MCP_OAUTH_CLIENT_ID registered by the Clarity authorization server.
export const OAUTH_CLIENT_ID = "clarity-mcp-client";
export const OAUTH_AUTHORIZE_URL = `${CLARITY_BASE_URL}/oauth/authorize`;
export const OAUTH_TOKEN_URL = `${CLARITY_BASE_URL}/oauth/token`;
export const OAUTH_REVOKE_URL = `${CLARITY_BASE_URL}/oauth/revoke`;
export const OAUTH_CALLBACK_PATH = "/callback";
export const OAUTH_LOGIN_TIMEOUT_MS = 10 * 60 * 1000;
export const OAUTH_LOGIN_STATUS_WAIT_MS = 10 * 1000;
export const OAUTH_REFRESH_SKEW_MS = 60 * 1000;
export const OAUTH_REQUEST_TIMEOUT_MS = 30 * 1000;
