import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import {
  CLARITY_BASE_URL,
  OAUTH_AUTHORIZE_URL,
  OAUTH_CALLBACK_PATH,
  OAUTH_CLIENT_ID,
  OAUTH_LOGIN_TIMEOUT_MS,
  OAUTH_LOGIN_STATUS_WAIT_MS,
  OAUTH_REFRESH_SKEW_MS,
  OAUTH_REQUEST_TIMEOUT_MS,
  OAUTH_REVOKE_URL,
  OAUTH_TOKEN_URL,
} from "../config.js";
import { createCredentialStore, type ICredentialStore } from "./credentialStore.js";
import { OAuthTokenError } from "./error.js";
import type {
  IOAuthClientDeps,
  LoginStatus,
  LogoutResult,
  PendingLogin,
  StartLoginResult,
  StoredSession,
  TokenResponse,
} from "./models.js";
import { acquireRefreshLock, createPkce, openInBrowser, refreshLockPortFor, respondPage, safeEqual } from "./utils.js";

export class ClarityOAuthClient {
  private readonly deps: IOAuthClientDeps;
  private store: Promise<ICredentialStore> | null = null;
  private accessToken: { value: string; expiresAtMs: number; } | null = null;
  private refreshInFlight: Promise<string | null> | null = null;
  private loginStartup: Promise<StartLoginResult> | null = null;
  private pendingLogin: PendingLogin | null = null;
  private lastLoginError: string | null = null;
  private readonly signInListeners: (() => void)[] = [];

  constructor(deps: Partial<IOAuthClientDeps> = {}) {
    this.deps = {
      createStore: () => createCredentialStore(CLARITY_BASE_URL),
      fetcher: (input, init) => fetch(input, init),
      openBrowser: openInBrowser,
      refreshLockPort: refreshLockPortFor(CLARITY_BASE_URL),
      ...deps,
    };
  }

  // Reads the store each time so a sign-in or sign-out by another server process on this machine is picked up.
  async isSignedIn(): Promise<boolean> {
    return !!(await this.loadSession());
  }

  // The current sign-in's id, or null when signed out. Changes on every new sign-in, including one by another process.
  async getSessionId(): Promise<string | null> {
    return (await this.loadSession())?.sessionId ?? null;
  }

  // The project the user selected for this sign-in, or null when none was selected.
  async getSelectedProjectId(): Promise<string | null> {
    return (await this.loadSession())?.selectedProjectId ?? null;
  }

  // Remembers (or with null, forgets) the project to query. Taken under the refresh lock so a concurrent refresh, which
  // rewrites the stored sign-in, cannot drop the choice. Returns false when not signed in.
  async selectProject(projectId: string | null): Promise<boolean> {
    return this.withRefreshLock(async () => {
      const store = await this.getStore();
      const session = await store.load();
      if (!session) {
        return false;
      }
      const { selectedProjectId: _previous, ...rest } = session;
      await store.save(projectId ? { ...rest, selectedProjectId: projectId } : rest);
      return true;
    });
  }

  // Called after a sign-in completes in the browser, e.g. to prefetch the user's projects.
  onSignIn(listener: () => void): void {
    this.signInListeners.push(listener);
  }

  async getStatus(): Promise<LoginStatus> {
    const session = await this.loadSession();
    return {
      signedIn: !!session,
      loginPending: !!this.pendingLogin,
      lastLoginError: this.lastLoginError,
      persistentStorage: (await this.getStore()).persistent,
    };
  }

  // Wait for browser completion or the status deadline; the model can check again if sign-in is still pending.
  async waitForLogin(timeoutMs = OAUTH_LOGIN_STATUS_WAIT_MS): Promise<void> {
    const login = this.pendingLogin;
    if (!login) {
      return;
    }
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      login.completion.then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  // Returns a valid access token, refreshing it when it is missing, about to expire, or was rejected by the service.
  async getAccessToken(rejectedAccessToken?: string): Promise<string | null> {
    if (!rejectedAccessToken && this.isAccessTokenValid(this.accessToken)) {
      return this.accessToken.value;
    }
    const shared = await this.loadSharedAccessToken(rejectedAccessToken);
    if (shared) {
      return shared;
    }
    const token = await this.refreshOnce(rejectedAccessToken);
    // A refresh already in flight for another caller may have reused the token the service just rejected.
    return rejectedAccessToken && token === rejectedAccessToken ? this.refreshOnce(rejectedAccessToken) : token;
  }

  // Refresh tokens rotate on every use, so concurrent callers in this process share one refresh.
  private refreshOnce(rejectedAccessToken?: string): Promise<string | null> {
    this.refreshInFlight ??= this.refresh(rejectedAccessToken).finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  // Starts the Authorization Code + PKCE flow and returns immediately; a loopback listener completes the sign-in in the
  // background, so a slow user does not run into the MCP client's tool-call timeout.
  async startLogin(): Promise<StartLoginResult> {
    if (this.loginStartup) {
      const result = await this.loginStartup;
      return { ...result, alreadyPending: true, browserOpened: false };
    }
    if (this.pendingLogin) {
      return { authorizeUrl: this.pendingLogin.authorizeUrl, alreadyPending: true, browserOpened: false };
    }

    const startup = this.beginLogin();
    this.loginStartup = startup;
    try {
      return await startup;
    } finally {
      if (this.loginStartup === startup) {
        this.loginStartup = null;
      }
    }
  }

  private async beginLogin(): Promise<StartLoginResult> {
    const { codeVerifier, codeChallenge, state } = createPkce();

    // The registered redirect is the IPv4 loopback on any port (RFC 8252 §7.3).
    const server = createServer();
    let complete = () => {};
    const completion = new Promise<void>((resolve) => { complete = resolve; });
    const login: PendingLogin = { state, codeVerifier, redirectUri: "", authorizeUrl: "", server, timer: null, callbackPending: false, completion, complete };
    this.pendingLogin = login;
    this.lastLoginError = null;
    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          server.removeListener("error", onError);
          server.removeListener("close", onClose);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onClose = () => onError(new Error("Clarity sign-in was cancelled."));
        server.once("error", onError);
        server.once("close", onClose);
        server.listen(0, "127.0.0.1", () => {
          cleanup();
          resolve();
        });
      });
    } catch (error) {
      this.finishLogin(login, "Could not start the Clarity sign-in listener.");
      throw error;
    }
    if (this.pendingLogin !== login) {
      server.close();
      throw new Error("Clarity sign-in was cancelled.");
    }
    const redirectUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}${OAUTH_CALLBACK_PATH}`;
    login.redirectUri = redirectUri;

    const authorizeUrl = new URL(OAUTH_AUTHORIZE_URL);
    new URLSearchParams({
      response_type: "code",
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    }).forEach((value, key) => authorizeUrl.searchParams.set(key, value));

    login.authorizeUrl = authorizeUrl.toString();
    login.timer = setTimeout(() => this.finishLogin(login, "Sign-in timed out before it was completed in the browser."), OAUTH_LOGIN_TIMEOUT_MS);
    login.timer.unref();

    server.on("request", (req, res) => {
      this.handleCallback(req, res, login).catch((error) => {
        console.error("Clarity sign-in callback failed:", error);
        respondPage(res, 500, "Sign-in failed", "Something went wrong while completing the sign-in. Return to your app and try again.");
        this.finishLogin(login, error instanceof OAuthTokenError
          ? `Sign-in failed while exchanging the authorization code: ${error.message}.`
          : "Sign-in failed while exchanging the authorization code.");
      });
    });

    return { authorizeUrl: authorizeUrl.toString(), alreadyPending: false, browserOpened: this.deps.openBrowser(authorizeUrl.toString()) };
  }

  // Ends the sign-in on the Clarity service (RFC 7009) and forgets it locally. The local sign-in is removed even when the
  // service cannot be reached, so the user is never left unable to sign out.
  async logout(): Promise<LogoutResult> {
    this.cancelPendingLogin();
    this.lastLoginError = null;
    this.accessToken = null;

    return this.withRefreshLock(async () => {
      const store = await this.getStore();
      const session = await store.load();
      if (!session) {
        return { wasSignedIn: false, revokedOnServer: false };
      }
      const revokedOnServer = await this.revoke(session.refreshToken);
      await store.clear();
      this.accessToken = null;
      return { wasSignedIn: true, revokedOnServer };
    });
  }

  private async handleCallback(req: IncomingMessage, res: ServerResponse, login: PendingLogin): Promise<void> {
    const url = new URL(req.url ?? "/", login.redirectUri);
    if (req.method !== "GET" || url.pathname !== OAUTH_CALLBACK_PATH) {
      respondPage(res, 404, "Not found", "This address only handles the Microsoft Clarity sign-in.");
      return;
    }
    // A response with the wrong state did not come from our authorize redirect; ignore it and keep waiting.
    if (!safeEqual(url.searchParams.get("state") ?? "", login.state)) {
      respondPage(res, 400, "Sign-in not recognized", "This sign-in response does not match the pending sign-in. Return to your app and try again.");
      return;
    }
    if (this.pendingLogin !== login || login.callbackPending) {
      respondPage(res, 409, "Sign-in no longer pending", "This sign-in response has already been handled or cancelled.");
      return;
    }
    login.callbackPending = true;

    const error = url.searchParams.get("error");
    if (error) {
      const message = error === "access_denied" ? "Sign-in was declined on the Clarity consent page." : `Sign-in failed: ${error}.`;
      respondPage(res, 200, "Sign-in not completed", `${message} You can close this window.`);
      this.finishLogin(login, message);
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      respondPage(res, 400, "Sign-in not completed", "The sign-in response did not include an authorization code.");
      this.finishLogin(login, "The sign-in response did not include an authorization code.");
      return;
    }

    const tokens = await this.requestTokens({
      grant_type: "authorization_code",
      client_id: OAUTH_CLIENT_ID,
      code,
      code_verifier: login.codeVerifier,
      redirect_uri: login.redirectUri,
    });
    // Another server process may have completed its own sign-in meanwhile. Only one sign-in is kept per machine, so the
    // one being replaced is ended on the service rather than left active and untracked.
    const outcome = await this.withRefreshLock(async () => {
      if (this.pendingLogin !== login) {
        return null;
      }
      const previous = await (await this.getStore()).load();
      if (this.pendingLogin !== login) {
        return null;
      }
      await this.storeTokens(tokens, randomUUID());
      return { previous };
    });
    if (!outcome) {
      await this.revoke(tokens.refresh_token);
      return;
    }
    const replaced = outcome.previous;
    if (replaced && replaced.refreshToken !== tokens.refresh_token) {
      await this.revoke(replaced.refreshToken);
    }
    const persistent = (await this.getStore()).persistent;
    if (this.pendingLogin !== login) {
      return;
    }
    respondPage(res, 200, "Signed in to Microsoft Clarity", persistent
      ? "You can close this window and return to your app."
      : "You can close this window and return to your app. This sign-in is not saved on this machine, so you will need to sign in again after the Clarity MCP server restarts.");
    this.finishLogin(login, null);
    for (const listener of this.signInListeners) {
      listener();
    }
  }

  private finishLogin(login: PendingLogin, error: string | null): void {
    if (this.pendingLogin !== login) {
      return;
    }
    this.lastLoginError = error;
    this.cancelPendingLogin();
  }

  private cancelPendingLogin(): void {
    if (!this.pendingLogin) {
      return;
    }
    if (this.pendingLogin.timer) {
      clearTimeout(this.pendingLogin.timer);
    }
    this.pendingLogin.server.close();
    this.pendingLogin.server.closeAllConnections?.();
    this.pendingLogin.complete();
    this.pendingLogin = null;
    this.loginStartup = null;
  }

  // The service revokes the whole sign-in when a rotated refresh token is replayed, so refreshes from every server
  // process on this machine are serialized and always use the latest stored refresh token.
  private refresh(rejectedAccessToken?: string): Promise<string | null> {
    return this.withRefreshLock(async () => {
      const store = await this.getStore();
      const session = await store.load();
      if (!session) {
        this.accessToken = null;
        return null;
      }
      // Another process may have refreshed while this one waited for the lock.
      const shared = await this.loadSharedAccessToken(rejectedAccessToken);
      if (shared) {
        return shared;
      }
      try {
        const tokens = await this.requestTokens({
          grant_type: "refresh_token",
          client_id: OAUTH_CLIENT_ID,
          refresh_token: session.refreshToken,
        });
        return await this.storeTokens(tokens, session.sessionId, session.selectedProjectId);
      } catch (error) {
        if (!(error instanceof OAuthTokenError && error.code === "invalid_grant")) {
          throw error;
        }
        // The sign-in was revoked or expired; the user must sign in again.
        this.accessToken = null;
        await store.clear();
        return null;
      }
    });
  }

  private async storeTokens(tokens: TokenResponse, sessionId: string, selectedProjectId?: string): Promise<string> {
    const store = await this.getStore();
    // Saved first: the service has already rotated the refresh token, so losing it would end the sign-in.
    await store.save({
      sessionId,
      refreshToken: tokens.refresh_token,
      ...(selectedProjectId ? { selectedProjectId } : {}),
    });
    this.accessToken = { value: tokens.access_token, expiresAtMs: Date.now() + tokens.expires_in * 1000 };
    try {
      await store.saveAccessToken({ sessionId, ...this.accessToken });
    } catch (error) {
      // Other server processes then refresh on their own, as they did before the access token was shared.
      console.error("Could not share the Clarity access token with other server processes:", error);
    }
    return tokens.access_token;
  }

  // The access token another server process on this machine saved for the current sign-in, if it is still usable.
  private async loadSharedAccessToken(rejectedAccessToken?: string): Promise<string | null> {
    const store = await this.getStore();
    const session = await store.load();
    if (!session) {
      return null;
    }
    const token = await store.loadAccessToken().catch((error) => {
      console.error("Could not read the shared Clarity access token:", error);
      return null;
    });
    if (!token || token.sessionId !== session.sessionId || token.value === rejectedAccessToken || !this.isAccessTokenValid(token)) {
      return null;
    }
    this.accessToken = { value: token.value, expiresAtMs: token.expiresAtMs };
    return token.value;
  }

  private isAccessTokenValid(accessToken: { value: string; expiresAtMs: number; } | null): accessToken is { value: string; expiresAtMs: number; } {
    return !!accessToken && accessToken.expiresAtMs - OAUTH_REFRESH_SKEW_MS > Date.now();
  }

  private async requestTokens(params: Record<string, string>): Promise<TokenResponse> {
    const response = await this.deps.fetcher(OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(params).toString(),
      signal: AbortSignal.timeout(OAUTH_REQUEST_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as (Partial<TokenResponse> & { error?: string; error_description?: string; }) | null;
    if (!response.ok || body?.error || !body?.access_token || !body.refresh_token || typeof body.expires_in !== "number") {
      throw new OAuthTokenError(body?.error ?? `http_${response.status}`, body?.error_description);
    }
    return body as TokenResponse;
  }

  private async revoke(refreshToken: string): Promise<boolean> {
    try {
      const response = await this.deps.fetcher(OAUTH_REVOKE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken, token_type_hint: "refresh_token", client_id: OAUTH_CLIENT_ID }).toString(),
        signal: AbortSignal.timeout(OAUTH_REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        console.error("Clarity sign-out request failed with status:", response.status);
      }
      return response.ok;
    } catch (error) {
      console.error("Clarity sign-out request failed:", error);
      return false;
    }
  }

  private async loadSession(): Promise<StoredSession | null> {
    return (await this.getStore()).load();
  }

  private getStore(): Promise<ICredentialStore> {
    this.store ??= this.deps.createStore();
    return this.store;
  }

  private async withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
    const release = await acquireRefreshLock(this.deps.refreshLockPort);
    try {
      return await fn();
    } finally {
      await release();
    }
  }
}

export const oauthClient = new ClarityOAuthClient();
