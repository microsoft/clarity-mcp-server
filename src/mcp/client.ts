import { getActiveCredential } from "../auth/credentials.js";
import {
  getDataExportTokenSingleProjectMessage,
  getNotSignedInMessage,
  getSignInEndedMessage,
} from "../auth/messages.js";
import { CredentialKind } from "../auth/models.js";
import { oauthClient } from "../auth/oauth.js";
import { sendWithOAuth } from "../auth/request.js";
import { CLARITY_API_TOKEN } from "../config.js";
import { describeOAuthFailure } from "../projects/service.js";
import {
  AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR,
  AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE,
  CLARITY_REQUEST_FAILED_MESSAGE,
  getServerErrorMessage,
} from "./messages.js";
import { type ToolResult, textResult } from "./results.js";

/**
 * Controls project targeting for a Clarity MCP API request.
 */
export interface CallOptions {
  /**
   * Overrides the selected project for this request without changing the stored
   * selection. Not supported when using a Data Export API token.
   */
  projectId?: string;
  /**
   * Omits the project from OAuth requests, including any explicit `projectId`,
   * for endpoints that are not project-specific, such as documentation.
   */
  noProject?: boolean;
}

/**
 * Calls a Clarity MCP endpoint using the active credentials.
 *
 * A Clarity sign-in takes precedence over a configured Data Export API token.
 * Project overrides apply only to this request, allowing parallel chats to query
 * different projects without changing the stored selection.
 *
 * @param url - The Clarity MCP endpoint URL.
 * @param body - The request payload to serialize as JSON.
 * @param options - Project-targeting options. Defaults to the selected project for OAuth.
 * @returns The response as formatted JSON text, or a message the assistant can
 * relay when credentials are unavailable or the request fails.
 */
export async function callClarityApi(url: string, body: unknown, options: CallOptions = {}): Promise<ToolResult> {
  const credential = await getActiveCredential();
  if (credential === CredentialKind.OAuth) {
    return callWithOAuth(url, body, options);
  }
  if (credential === CredentialKind.DataExportToken) {
    return callWithDataExportToken(url, body, CLARITY_API_TOKEN!, options);
  }
  return textResult(getNotSignedInMessage(), true);
}

/**
 * Sends a JSON POST request using the current Clarity sign-in.
 *
 * Unless `noProject` is set, an explicit project ID takes precedence over the
 * stored selection. The OAuth sender handles token refresh and a single retry
 * on HTTP 401. An ended sign-in, unsuccessful response, or caught exception
 * produces an error result; caught exceptions are also logged.
 *
 * @param url - The Clarity MCP endpoint URL.
 * @param body - The request payload to serialize as JSON.
 * @param options - Options controlling the project attached to the request.
 * @returns The response as formatted JSON text, or an error message the assistant can relay.
 */
async function callWithOAuth(url: string, body: unknown, options: CallOptions): Promise<ToolResult> {
  try {
    const projectId = options.noProject ? undefined : options.projectId ?? (await oauthClient.getSelectedProjectId()) ?? undefined;
    const response = await sendWithOAuth(url, body, projectId);

    if (!response) {
      return textResult(getSignInEndedMessage(), true);
    }
    if (!response.ok) {
      return textResult(await describeOAuthFailure(response, projectId), true);
    }

    return textResult(JSON.stringify(await response.json(), null, 2));
  } catch (error) {
    console.error("Microsoft Clarity API request failed:", error);
    return textResult(CLARITY_REQUEST_FAILED_MESSAGE, true);
  }
}

/**
 * Sends a JSON POST request using a project-scoped Data Export API token.
 *
 * An explicit project override is rejected because the token can query only its
 * own project. Domain-verification failures return a dedicated error result;
 * server errors return an error result with the service's request ID when present.
 * Other request failures are logged and return the existing generic text result
 * without setting `isError`.
 *
 * @param url - The Clarity MCP endpoint URL.
 * @param body - The request payload to serialize as JSON.
 * @param token - The Data Export API token used to authorize the request.
 * @param options - Request options; `projectId` is rejected and `noProject` is ignored.
 * @returns The response as formatted JSON text, or a request-failure message.
 */
async function callWithDataExportToken(url: string, body: unknown, token: string, options: CallOptions = {}): Promise<ToolResult> {
  if (options.projectId) {
    return textResult(getDataExportTokenSingleProjectMessage() + " Omit projectId to query the token's project.", true);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status >= 500) {
        const message = getServerErrorMessage(response);
        console.error("Microsoft Clarity API request failed:", url, response.status, message);
        return textResult(message, true);
      }
      const error = ((await response.json().catch(() => null)) as { error?: string; } | null)?.error;
      if (response.status === 403 && error === AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR) {
        return textResult(AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE, true);
      }
      throw new Error(`Endpoint request failed with status: ${url} ${response.status}`);
    }

    return textResult(JSON.stringify(await response.json(), null, 2));
  } catch (error) {
    console.error("Microsoft Clarity API request failed:", error);
    return textResult(CLARITY_REQUEST_FAILED_MESSAGE);
  }
}
