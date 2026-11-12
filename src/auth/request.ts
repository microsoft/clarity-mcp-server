import { oauthClient } from "./oauth.js";

/**
 * HTTP header identifying the Clarity project targeted by an authenticated request.
 */
export const PROJECT_ID_HEADER = "x-clarity-project-id";

/**
 * Sends a JSON POST request using the current Clarity sign-in's access token.
 *
 * Adds the project header only when a non-empty project ID is supplied; this
 * function does not resolve or change the selected project. If the first request
 * returns HTTP 401, asks the OAuth client for a refreshed access token and retries
 * once. Other responses, including a second HTTP 401, are returned unchanged for
 * the caller to interpret.
 *
 * @param url - The endpoint URL to send the request to.
 * @param body - The request payload to serialize as JSON.
 * @param projectId - The project ID to include in the request header, or `undefined`
 * for a request without an explicit project.
 * @returns The initial or retried HTTP response, or `null` if the OAuth client
 * cannot provide an access token before either attempt.
 * @throws Propagates token-acquisition, JSON-serialization, and network errors
 * so the caller can log them and produce an appropriate tool result.
 */
export async function sendWithOAuth(url: string, body: unknown, projectId: string | undefined): Promise<Response | null> {
  const send = (token: string) => fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(projectId ? { [PROJECT_ID_HEADER]: projectId } : {}),
    },
    body: JSON.stringify(body),
  });

  let accessToken = await oauthClient.getAccessToken();
  if (!accessToken) {
    return null;
  }
  const response = await send(accessToken);
  if (response.status !== 401) {
    return response;
  }
  // The access token may have expired early; refresh once. A revoked sign-in fails the refresh.
  accessToken = await oauthClient.getAccessToken(accessToken);
  return accessToken ? send(accessToken) : null;
}
