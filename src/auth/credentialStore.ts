import type { AsyncEntry } from "@napi-rs/keyring";

import type { StoredAccessToken, StoredSession } from "./models.js";

const KEYRING_SERVICE = "microsoft-clarity-mcp";
const KEYRING_ACCOUNT = "oauth-session";
// Kept apart from the sign-in because a credential is size-limited (1280 characters on Windows): the access token's size
// is set by the service (signing key, claims), so it must not be able to crowd out the refresh token.
const KEYRING_ACCESS_TOKEN_ACCOUNT = "oauth-access-token";

/**
 * Stores a Clarity sign-in and its access token in separate records.
 *
 * Storage does not refresh tokens or enforce expiration or session matching;
 * those responsibilities belong to the OAuth client.
 */
export interface ICredentialStore {
  /** Whether credentials are retained beyond the lifetime of this server process. */
  readonly persistent: boolean;

  /**
   * Reads the stored sign-in.
   *
   * @returns The sign-in, or `null` when absent or rejected by storage validation.
   */
  load(): Promise<StoredSession | null>;

  /**
   * Replaces the stored sign-in without modifying its separately stored access token.
   *
   * @param session - The sign-in to store.
   */
  save(session: StoredSession): Promise<void>;

  /**
   * Reads the stored access token without checking its expiration.
   *
   * @returns The token, or `null` when absent or rejected by storage validation.
   */
  loadAccessToken(): Promise<StoredAccessToken | null>;

  /**
   * Replaces the stored access token without modifying the sign-in.
   *
   * @param token - The access token and its session identity and expiration.
   */
  saveAccessToken(token: StoredAccessToken): Promise<void>;

  /**
   * Removes the stored sign-in and its access token.
   */
  clear(): Promise<void>;
}

/**
 * Keeps credentials in memory for a single server process.
 *
 * Values are retained and returned by reference without serialization or
 * validation. Used when the OS credential store is unavailable.
 */
export class MemoryCredentialStore implements ICredentialStore {
  /** In-memory credentials are not retained after the server process exits. */
  readonly persistent = false;
  private session: StoredSession | null = null;
  private accessToken: StoredAccessToken | null = null;

  /** {@inheritDoc ICredentialStore.load} */
  async load(): Promise<StoredSession | null> {
    return this.session;
  }

  /** {@inheritDoc ICredentialStore.save} */
  async save(session: StoredSession): Promise<void> {
    this.session = session;
  }

  /** {@inheritDoc ICredentialStore.loadAccessToken} */
  async loadAccessToken(): Promise<StoredAccessToken | null> {
    return this.accessToken;
  }

  /** {@inheritDoc ICredentialStore.saveAccessToken} */
  async saveAccessToken(token: StoredAccessToken): Promise<void> {
    this.accessToken = token;
  }

  /** {@inheritDoc ICredentialStore.clear} */
  async clear(): Promise<void> {
    this.session = null;
    this.accessToken = null;
  }
}

/**
 * Persists JSON-serialized credentials in separate OS credential-store entries.
 *
 * Read and write failures propagate to the caller. Invalid stored JSON or record
 * shapes are treated as missing credentials.
 */
export class KeyringCredentialStore implements ICredentialStore {
  /** Credentials are persisted by the OS credential store. */
  readonly persistent = true;

  /**
   * @param entry - The credential-store entry containing the sign-in.
   * @param accessTokenEntry - The separate entry containing the access token.
   */
  constructor(private readonly entry: AsyncEntry, private readonly accessTokenEntry: AsyncEntry) { }

  /** {@inheritDoc ICredentialStore.load} */
  async load(): Promise<StoredSession | null> {
    const value = await this.entry.getPassword();
    return value ? parseSession(value) : null;
  }

  /** {@inheritDoc ICredentialStore.save} */
  async save(session: StoredSession): Promise<void> {
    await this.entry.setPassword(JSON.stringify(session));
  }

  /** {@inheritDoc ICredentialStore.loadAccessToken} */
  async loadAccessToken(): Promise<StoredAccessToken | null> {
    const value = await this.accessTokenEntry.getPassword();
    return value ? parseAccessToken(value) : null;
  }

  /** {@inheritDoc ICredentialStore.saveAccessToken} */
  async saveAccessToken(token: StoredAccessToken): Promise<void> {
    await this.accessTokenEntry.setPassword(JSON.stringify(token));
  }

  /**
   * Deletes the access-token entry before deleting the sign-in entry.
   *
   * Access-token deletion errors are ignored; sign-in deletion errors propagate.
   */
  async clear(): Promise<void> {
    // The access token may never have been saved, so a missing entry is not an error.
    await this.accessTokenEntry.deletePassword().catch(() => undefined);
    await this.entry.deletePassword();
  }
}

/**
 * Parses a stored access token and validates its required fields.
 *
 * @param value - The JSON read from the access-token entry.
 * @returns A token with a string session ID, non-empty token value, and finite
 * numeric expiration, or `null` for invalid JSON or fields. Does not check expiry.
 */
function parseAccessToken(value: string): StoredAccessToken | null {
  try {
    const token = JSON.parse(value) as Partial<StoredAccessToken> | null;

    if (typeof token?.sessionId !== "string" || typeof token.value !== "string" || !token.value) {
      return null;
    }
    if (typeof token.expiresAtMs !== "number" || !Number.isFinite(token.expiresAtMs)) {
      return null;
    }

    return {
      sessionId: token.sessionId,
      value: token.value,
      expiresAtMs: token.expiresAtMs
    };
  } catch {
    return null;
  }
}

/**
 * Parses a stored sign-in, retaining only supported fields.
 *
 * Requires a non-empty refresh token, defaults a missing or invalid session ID
 * to an empty string, and omits an empty or invalid selected project ID.
 *
 * @param value - The JSON read from the sign-in entry.
 * @returns The normalized sign-in, or `null` for invalid JSON or a missing or
 * invalid refresh token.
 */
function parseSession(value: string): StoredSession | null {
  try {
    const session = JSON.parse(value) as Partial<StoredSession> | null;

    if (typeof session?.refreshToken !== "string" || !session.refreshToken) {
      return null;
    }

    const sessionId = typeof session.sessionId === "string" ? session.sessionId : "";
    const selectedProjectId = typeof session.selectedProjectId === "string" && session.selectedProjectId ? session.selectedProjectId : undefined;

    return {
      sessionId: sessionId,
      refreshToken: session.refreshToken,
      selectedProjectId: selectedProjectId,
    };
  } catch {
    return null;
  }
}

/**
 * Creates an OS-backed credential store, falling back to process-local memory.
 *
 * Loads the native keyring module on demand and probes the sign-in entry to check
 * availability. If initialization or the probe fails, logs the failure and
 * returns an in-memory store. Later operations on an OS-backed store do not
 * automatically fall back to memory.
 *
 * @param origin - The Clarity service origin used to namespace both credential
 * entries and keep credentials for different service origins separate.
 * @returns An OS-backed store when initialization succeeds, otherwise a
 * non-persistent in-memory store.
 */
export async function createCredentialStore(origin: string): Promise<ICredentialStore> {
  try {
    // Loaded on demand: the native binary may be missing for this platform (e.g. a bundle built on another OS), which
    // must not stop the server, so existing Data Export token users are unaffected.
    const { AsyncEntry } = await import("@napi-rs/keyring");
    const entry = new AsyncEntry(KEYRING_SERVICE, `${KEYRING_ACCOUNT}:${origin}`);
    // A read proves the secret service is reachable; a missing entry is not an error.
    await entry.getPassword();
    return new KeyringCredentialStore(entry, new AsyncEntry(KEYRING_SERVICE, `${KEYRING_ACCESS_TOKEN_ACCOUNT}:${origin}`));
  } catch (error) {
    console.error("OS credential store unavailable; the Clarity sign-in will only last until the server stops:", error);
    return new MemoryCredentialStore();
  }
}
