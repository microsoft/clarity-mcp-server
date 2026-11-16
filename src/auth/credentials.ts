import { CLARITY_API_TOKEN } from "../config.js";
import { CredentialKind } from "./models.js";
import { oauthClient } from "./oauth.js";

/**
 * Determines which credential the Clarity tools should use.
 *
 * An existing Clarity sign-in takes precedence over a configured Data Export API
 * token because signing in is an explicit user action. If the sign-in cannot be
 * read, the failure is logged and credential selection falls back to the token.
 *
 * @returns The OAuth credential kind when signed in, otherwise the Data Export
 * token credential kind when configured, or `CredentialKind.None`.
 */
export async function getActiveCredential(): Promise<CredentialKind> {
  if (await isSignedIn()) {
    return CredentialKind.OAuth;
  }
  return CLARITY_API_TOKEN ? CredentialKind.DataExportToken : CredentialKind.None;
}

/**
 * Checks whether a Clarity sign-in is available.
 *
 * @returns Whether the user is signed in. Returns `false` and logs the error if
 * the sign-in cannot be read.
 */
async function isSignedIn(): Promise<boolean> {
  try {
    return await oauthClient.isSignedIn();
  } catch (error) {
    console.error("Could not read the Clarity sign-in:", error);
    return false;
  }
}
