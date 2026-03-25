import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getConfigValue } from "./utils.js";

export interface AccountEntry {
  token: string;
}

export interface AccountsConfig {
  default?: string;
  accounts: Record<string, AccountEntry>;
}

const CONFIG_PATHS = [
  path.join(os.homedir(), ".clarity-mcp", "accounts.json"),
  path.join(os.homedir(), ".config", "clarity-mcp", "accounts.json"),
];

let _cached: AccountsConfig | null = null;

/**
 * Load accounts from config file, CLI args, or env vars.
 * Priority:
 *   1. --accounts-file=/path/to/accounts.json
 *   2. ~/.clarity-mcp/accounts.json or ~/.config/clarity-mcp/accounts.json
 *   3. Single token via --clarity_api_token or CLARITY_API_TOKEN (legacy compat)
 */
export function loadAccounts(): AccountsConfig {
  if (_cached) return _cached;

  // Check for explicit accounts file path
  const explicitPath = getConfigValue("accounts_file") || getConfigValue("accounts-file");
  if (explicitPath && fs.existsSync(explicitPath)) {
    _cached = parseAccountsFile(explicitPath);
    return _cached;
  }

  // Check default config paths
  for (const configPath of CONFIG_PATHS) {
    if (fs.existsSync(configPath)) {
      _cached = parseAccountsFile(configPath);
      return _cached;
    }
  }

  // Fallback: single token from CLI/env (backward compatible)
  const singleToken = getConfigValue("clarity_api_token");
  if (singleToken) {
    _cached = {
      default: "default",
      accounts: {
        default: { token: singleToken },
      },
    };
    return _cached;
  }

  // No config at all
  _cached = { accounts: {} };
  return _cached;
}

function parseAccountsFile(filePath: string): AccountsConfig {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    if (!parsed.accounts || typeof parsed.accounts !== "object") {
      console.error(`Invalid accounts config: missing "accounts" object in ${filePath}`);
      return { accounts: {} };
    }

    // Validate each entry has a token
    const accounts: Record<string, AccountEntry> = {};
    for (const [domain, entry] of Object.entries(parsed.accounts)) {
      const e = entry as any;
      if (typeof e?.token === "string" && e.token.length > 0) {
        accounts[domain] = { token: e.token };
      } else {
        console.error(`Skipping account "${domain}": missing or empty token`);
      }
    }

    return {
      default: parsed.default || undefined,
      accounts,
    };
  } catch (err) {
    console.error(`Failed to parse accounts config at ${filePath}:`, err);
    return { accounts: {} };
  }
}

/**
 * Resolve the API token for a given account identifier (domain).
 * Falls back to default account if no account specified.
 */
export function resolveToken(account?: string): { token: string; account: string } | null {
  const config = loadAccounts();
  const domains = Object.keys(config.accounts);

  if (domains.length === 0) return null;

  // If account specified, look it up directly
  if (account) {
    const entry = config.accounts[account];
    if (entry) return { token: entry.token, account };

    // Try case-insensitive match
    const lower = account.toLowerCase();
    for (const [domain, entry] of Object.entries(config.accounts)) {
      if (domain.toLowerCase() === lower) {
        return { token: entry.token, account: domain };
      }
    }

    return null; // Not found
  }

  // No account specified — use default
  if (config.default && config.accounts[config.default]) {
    return { token: config.accounts[config.default]!.token, account: config.default };
  }

  // If only one account, use it
  if (domains.length === 1) {
    const domain = domains[0]!;
    return { token: config.accounts[domain]!.token, account: domain };
  }

  // Multiple accounts, no default set, no account specified
  return null;
}

/**
 * List all configured account domains.
 */
export function listAccounts(): string[] {
  const config = loadAccounts();
  return Object.keys(config.accounts);
}

/**
 * Get the default account domain, if set.
 */
export function getDefaultAccount(): string | undefined {
  return loadAccounts().default;
}
