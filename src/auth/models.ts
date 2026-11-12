import type { Server } from "node:http";
import type { ICredentialStore } from "./credentialStore.js";

// The credentials the Clarity tools use for a request.
export enum CredentialKind {
  OAuth = "oauth",
  DataExportToken = "data-export-token",
  None = "none",
}

export interface StoredSession {
  // Identifies one sign-in across refreshes, so data cached for it is dropped when the user signs out or in again.
  sessionId: string;
  refreshToken: string;
  // The project the user selected; kept with the sign-in so a new sign-in starts without one.
  selectedProjectId?: string;
}

// An access token shared by every server process on this machine, so a new process does not rotate the refresh token.
export interface StoredAccessToken {
  // The sign-in it was issued for; a token left from an earlier sign-in is ignored.
  sessionId: string;
  value: string;
  expiresAtMs: number;
}

export interface LoginStatus {
  signedIn: boolean;
  loginPending: boolean;
  lastLoginError: string | null;
  persistentStorage: boolean;
}

export interface StartLoginResult {
  authorizeUrl: string;
  alreadyPending: boolean;
  browserOpened: boolean;
}

export interface LogoutResult {
  wasSignedIn: boolean;
  // Whether the Clarity service confirmed the sign-in was ended; false when it could not be reached.
  revokedOnServer: boolean;
}

// The token endpoint's successful response.
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// A browser sign-in waiting for its loopback callback.
export interface PendingLogin extends LoginRequest {
  authorizeUrl: string;
  server: Server;
  timer: NodeJS.Timeout | null;
  callbackPending: boolean;
  completion: Promise<void>;
  complete: () => void;
}

// What the loopback callback needs to complete one sign-in.
export interface LoginRequest {
  state: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface IOAuthClientDeps {
  createStore: () => Promise<ICredentialStore>;
  fetcher: typeof fetch;
  openBrowser: (url: string) => boolean;
  refreshLockPort: number;
}
