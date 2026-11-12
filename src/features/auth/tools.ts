import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getActiveCredential } from "../../auth/credentials.js";
import { CredentialKind } from "../../auth/models.js";
import { oauthClient } from "../../auth/oauth.js";
import { CLARITY_API_TOKEN } from "../../config.js";
import { textResult } from "../../mcp/results.js";
import { getSignedInProjects } from "../../projects/service.js";
import { SELECT_PROJECT_TOOL } from "../projects/tools.js";

// --- Sign In to Microsoft Clarity ---

export const LOGIN_TOOL = "login";
export const LOGIN_DESCRIPTION = () => `Sign in to Microsoft Clarity with the user's Clarity account. Opens the Clarity sign-in and consent page in the browser and returns its URL so it can be shown to the user if the browser does not open. Returns immediately; call ${LOGIN_STATUS_TOOL} right away and repeat while loginPending is true, without asking the user to confirm completion. The server automatically receives the authorization code and exchanges tokens when the browser redirects. Project requests are restricted by the user's admin or member permissions for each project. Not needed when a Data Export API token is configured.`;

function registerLoginTool(server: McpServer): void {
  server.tool(
    LOGIN_TOOL,                                   /* Name */
    LOGIN_DESCRIPTION(),                          /* Description */
    {},                                           /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Sign In to Microsoft Clarity",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    },
    async () => {
      try {
        if (await oauthClient.isSignedIn()) {
          return textResult(`Already signed in to Microsoft Clarity. To use a different account, call \`${LOGOUT_TOOL}\` first, then \`${LOGIN_TOOL}\`.`);
        }
        const { authorizeUrl, alreadyPending, browserOpened } = await oauthClient.startLogin();
        const opened = alreadyPending
          ? "A sign-in is already waiting to be completed in the browser."
          : browserOpened
            ? "The Microsoft Clarity sign-in page was opened in the browser."
            : "The browser could not be opened automatically.";
        const { persistentStorage } = await oauthClient.getStatus();
        const storageNote = persistentStorage
          ? ""
          : "\n\nTell the user: this sign-in will not be saved because no OS credential store (such as Windows Credential Manager, macOS Keychain or Linux Secret Service) is available on this machine, so they will need to sign in again after the Clarity MCP server restarts.";
        return textResult(
          `${opened} Tell the user to sign in and approve access in the browser, opening this link if needed:\n${authorizeUrl}\n\n` +
          `Call \`${LOGIN_STATUS_TOOL}\` immediately and repeat while loginPending is true. Do not ask the user whether they have finished signing in or wait for a chat reply. The server automatically receives the authorization code and exchanges tokens after the browser redirects. If lastLoginError is set, report it and stop checking; do not claim sign-in succeeded. Once signed in, tell the user which projects they can access and that requests are restricted by their admin or member permissions for each project. If they have several, ask which one to use and call \`${SELECT_PROJECT_TOOL}\`. The link expires in 10 minutes.` +
          storageNote
        );
      } catch (error) {
        console.error("Could not start the Clarity sign-in:", error);
        return textResult("Could not start the Microsoft Clarity sign-in. Try again shortly.", true);
      }
    }
  );
}

// --- Microsoft Clarity Sign-In Status ---

export const LOGIN_STATUS_TOOL = "login-status";
export const LOGIN_STATUS_DESCRIPTION = "Show whether the user is signed in to Microsoft Clarity, accessible projects, the selected project, and the active credentials. While browser sign-in is pending, waits up to 10 seconds for completion or failure. Call immediately after login and repeat while loginPending is true without asking for user confirmation. Report lastLoginError and stop on failure. Project requests are restricted by the user's admin or member permissions for each project, not OAuth scopes.";

function describeCredential(credential: CredentialKind): string {
  switch (credential) {
    case CredentialKind.OAuth:
      return "Clarity sign-in";
    case CredentialKind.DataExportToken:
      return "Data Export API token";
    case CredentialKind.None:
      return "none";
  }
}

function registerLoginStatusTool(server: McpServer): void {
  server.tool(
    LOGIN_STATUS_TOOL,                            /* Name */
    LOGIN_STATUS_DESCRIPTION,                     /* Description */
    {},                                           /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Microsoft Clarity Sign-In Status",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async () => {
      try {
        await oauthClient.waitForLogin();
        const [status, credential] = await Promise.all([oauthClient.getStatus(), getActiveCredential()]);
        return textResult(JSON.stringify({
          signedIn: status.signedIn,
          projectPermissions: "Requests are restricted by your admin or member permissions for each Clarity project; signing in does not grant additional project permissions.",
          ...(status.signedIn ? await getSignedInProjects() : {}),
          loginPending: status.loginPending,
          lastLoginError: status.lastLoginError,
          signInRemembered: status.persistentStorage,
          dataExportTokenConfigured: !!CLARITY_API_TOKEN,
          activeCredential: describeCredential(credential),
        }, null, 2), !!status.lastLoginError);
      } catch (error) {
        console.error("Could not read the Clarity sign-in status:", error);
        return textResult("Could not read the Microsoft Clarity sign-in status.", true);
      }
    }
  );
}

// --- Sign Out of Microsoft Clarity ---

export const LOGOUT_TOOL = "logout";
export const LOGOUT_DESCRIPTION = "Sign out of Microsoft Clarity: ends the sign-in on the Clarity service and removes it from this machine. Does not affect a configured Data Export API token.";

function registerLogoutTool(server: McpServer): void {
  server.tool(
    LOGOUT_TOOL,                                  /* Name */
    LOGOUT_DESCRIPTION,                           /* Description */
    {},                                           /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Sign Out of Microsoft Clarity",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    },
    async () => {
      try {
        const { wasSignedIn, revokedOnServer } = await oauthClient.logout();
        const fallback = CLARITY_API_TOKEN ? " The Clarity tools will now use the configured Data Export API token." : "";
        if (!wasSignedIn) {
          return textResult(`Not signed in to Microsoft Clarity; nothing to sign out of.${fallback}`);
        }
        return textResult(revokedOnServer
          ? `Signed out of Microsoft Clarity.${fallback}`
          : `Signed out of Microsoft Clarity on this machine, but the Clarity service could not be reached to end the sign-in. It stops working when it expires, or can be removed from your Clarity account settings.${fallback}`);
      } catch (error) {
        console.error("Could not sign out of Clarity:", error);
        return textResult("Could not sign out of Microsoft Clarity. Try again shortly.", true);
      }
    }
  );
}

// --- Registration ---

export function registerAuthTools(server: McpServer): void {
  registerLoginTool(server);
  registerLoginStatusTool(server);
  registerLogoutTool(server);
}
