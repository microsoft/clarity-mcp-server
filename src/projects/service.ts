import { getActiveCredential } from "../auth/credentials.js";
import {
  getDataExportTokenSingleProjectMessage,
  getNotSignedInMessage,
  getSignInEndedMessage,
} from "../auth/messages.js";
import { CredentialKind } from "../auth/models.js";
import { oauthClient } from "../auth/oauth.js";
import { sendWithOAuth } from "../auth/request.js";
import { CLARITY_API_TOKEN, mcpApiUrl } from "../config.js";
import { LOGIN_TOOL, LOGOUT_TOOL } from "../features/auth/tools.js";
import { LIST_PROJECTS_TOOL, SELECT_PROJECT_TOOL } from "../features/projects/tools.js";
import {
  AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR,
  AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE,
  CLARITY_SERVER_ERROR_MESSAGE,
  withRequestId,
} from "../mcp/messages.js";
import { type ToolResult, textResult } from "../mcp/results.js";
import type { ProjectsResponse, ProjectSummary } from "./models.js";
import { describeProject, describeProjectList, findProject } from "./utils.js";

export const PROJECTS_LIST_URL = mcpApiUrl("/projects/list");

const PROJECTS_REQUEST_TIMEOUT_MS = 30 * 1000;

// How long the signed-in user's project list is reused. Checked only when a tool runs; nothing refreshes in the background,
// so an idle chat makes no requests and the first use after expiry re-reads the list.
export const PROJECTS_CACHE_TTL_MS = 10 * 60 * 1000;

// The signed-in user's Clarity projects: the project tools, the per-sign-in project cache, and explanations of failed
// requests, most of which depend on the user's projects.

// The projects the signed-in user can query, from a per-sign-in cache. Needs a sign-in: a Data Export token cannot list projects.
export async function listProjects(refresh = false): Promise<ToolResult> {
  const credential = await getActiveCredential();
  if (credential === CredentialKind.OAuth) {
    const sessionId = await oauthClient.getSessionId();
    if (sessionId === null) {
      return textResult(getSignInEndedMessage(), true);
    }
    const outcome = await getOAuthProjects(refresh, sessionId);
    if (!outcome.error) {
      const selection = await describeSelection(outcome.projects, sessionId);
      return selection && await oauthClient.getSessionId() === sessionId
        ? textResult(JSON.stringify({ projects: outcome.projects, ...selection }, null, 2))
        : textResult(SESSION_CHANGED_MESSAGE, true);
    }
    // When the sign-in has just ended and a token is configured, the tools fall back to the token.
    if (!(outcome.signInEnded && CLARITY_API_TOKEN)) {
      return textResult(outcome.error, true);
    }
    return textResult(`${outcome.error} ${getDataExportTokenSingleProjectMessage()}`, true);
  }
  return textResult(CLARITY_API_TOKEN ? getDataExportTokenSingleProjectMessage() : getNotSignedInMessage(), true);
}

// The signed-in user's projects and selected project for the sign-in status, or why they could not be listed.
export async function getSignedInProjects(): Promise<object> {
  try {
    const sessionId = await oauthClient.getSessionId();
    if (sessionId === null) {
      return { projectsError: getNotSignedInMessage() };
    }
    const outcome = await getOAuthProjects(false, sessionId);
    if (outcome.error) {
      return { projectsError: outcome.error };
    }
    const selection = await describeSelection(outcome.projects, sessionId);
    return selection && await oauthClient.getSessionId() === sessionId
      ? { projects: outcome.projects, ...selection } : { projectsError: SESSION_CHANGED_MESSAGE };
  } catch (error) {
    console.error("Could not list the Clarity projects:", error);
    return { projectsError: "Could not list your Clarity projects. Try again shortly." };
  }
}

// Makes a project the one the Clarity tools query for this sign-in, after checking it is one of the user's projects.
export async function selectProject(projectId: string): Promise<ToolResult> {
  const credential = await getActiveCredential();
  if (credential === CredentialKind.DataExportToken) {
    return textResult(getDataExportTokenSingleProjectMessage(), true);
  }
  if (credential === CredentialKind.None) {
    return textResult(getNotSignedInMessage(), true);
  }
  try {
    const sessionId = await oauthClient.getSessionId();
    if (sessionId === null) {
      return textResult(getSignInEndedMessage(), true);
    }
    let outcome = await getOAuthProjects(false, sessionId);
    let project = findProject(outcome.projects, projectId);
    if (!outcome.error && !project) {
      // The user may have just gained access to it.
      outcome = await getOAuthProjects(true, sessionId);
      project = findProject(outcome.projects, projectId);
    }
    if (await oauthClient.getSessionId() !== sessionId) {
      return textResult(SESSION_CHANGED_MESSAGE, true);
    }
    if (outcome.error) {
      return textResult(outcome.error, true);
    }
    if (!project) {
      return textResult(`Project ${projectId} is not one of the projects your Clarity account can access as an admin or member. ${describeProjectList(outcome.projects)}`, true);
    }
    if (!(await oauthClient.selectProject(project.projectId, sessionId))) {
      return textResult(await oauthClient.getSessionId() === null ? getNotSignedInMessage() : SESSION_CHANGED_MESSAGE, true);
    }
    if (await oauthClient.getSessionId() !== sessionId) {
      return textResult(SESSION_CHANGED_MESSAGE, true);
    }
    return textResult(`Selected project ${describeProject(project)}. The Clarity tools will query this project until another one is selected.`);
  } catch (error) {
    console.error("Could not select the Clarity project:", error);
    return textResult("Could not select the Clarity project. Try again shortly.", true);
  }
}

// Warms the project cache right after a sign-in so the first status check or query does not wait for it.
export function prefetchProjects(): void {
  getOAuthProjects(true).catch((error) => console.error("Could not prefetch the Clarity projects:", error));
}

// The project the tools query: the selected one, or the user's only project, which the service picks on its own.
async function describeSelection(projects: readonly ProjectSummary[], sessionId: string): Promise<{ selectedProject: ProjectSummary | null; } | null> {
  const selectedId = await oauthClient.getSelectedProjectId(sessionId);
  if (await oauthClient.getSessionId() !== sessionId) {
    return null;
  }
  const selected = selectedId ? findProject(projects, selectedId) ?? { projectId: selectedId, name: null, hostname: null } : null;
  return { selectedProject: selected ?? (projects.length === 1 ? projects[0]! : null) };
}

// ---- Project cache ----

// The list only helps the assistant match names to ids; the service still checks access on every call, so a stale entry
// can never grant access. It is keyed by sign-in, so signing out or in as someone else (in any process) drops it.
let projectCache: { sessionId: string; projects: ProjectSummary[]; expiresAtMs: number; } | null = null;

let projectFetch: { sessionId: string; promise: Promise<ProjectsResponse>; } | null = null;

export const SESSION_CHANGED_MESSAGE = "Your Clarity sign-in changed while the request was running. Run the tool again for the current account.";

async function getCachedProjects(expectedSessionId?: string): Promise<ProjectSummary[]> {
  const sessionId = await oauthClient.getSessionId();
  if (expectedSessionId !== undefined && sessionId !== expectedSessionId) {
    return [];
  }
  return sessionId !== null && projectCache?.sessionId === sessionId && projectCache.expiresAtMs > Date.now()
    ? projectCache.projects : [];
}

async function getOAuthProjects(refresh: boolean, expectedSessionId?: string): Promise<ProjectsResponse> {
  const sessionId = await oauthClient.getSessionId();
  if (expectedSessionId !== undefined && sessionId !== expectedSessionId) {
    return { projects: [], error: SESSION_CHANGED_MESSAGE };
  }
  if (sessionId === null) {
    projectCache = null;
    return { projects: [], error: getNotSignedInMessage() };
  }
  if (!refresh && projectCache?.sessionId === sessionId && projectCache.expiresAtMs > Date.now()) {
    return { projects: projectCache.projects };
  }
  if (projectFetch?.sessionId !== sessionId) {
    const signal = AbortSignal.timeout(PROJECTS_REQUEST_TIMEOUT_MS);
    const promise = fetchOAuthProjects(sessionId, signal).catch((error) => {
      if (!signal.aborted) {
        throw error;
      }
      console.error("The Clarity project-list request timed out:", error);
      return {
        projects: [],
        error: "The Clarity project-list request timed out. Try again shortly.",
      };
    }).finally(() => {
      if (projectFetch?.promise === promise) {
        projectFetch = null;
      }
    });
    projectFetch = { sessionId, promise };
  }
  return projectFetch.promise;
}

async function fetchOAuthProjects(sessionId: string, signal: AbortSignal): Promise<ProjectsResponse> {
  const response = await sendWithOAuth(PROJECTS_LIST_URL, {}, undefined, sessionId, signal);
  const currentSessionId = await oauthClient.getSessionId();
  if (currentSessionId === null) {
    projectCache = null;
    if (response?.status === 401) {
      return { projects: [], error: await describeRequestFailure(response, undefined), signInEnded: true };
    }
    return { projects: [], error: getSignInEndedMessage(), signInEnded: true };
  }
  if (currentSessionId !== sessionId) {
    return { projects: [], error: SESSION_CHANGED_MESSAGE };
  }
  if (!response) {
    projectCache = null;
    return { projects: [], error: getSignInEndedMessage(), signInEnded: true };
  }
  let projects: ProjectSummary[];
  if (response.ok) {
    projects = ((await response.json()) as { projects?: ProjectSummary[]; }).projects ?? [];
  } else if (response.status === 404) {
    projects = [];
  } else {
    return {
      projects: [],
      error: await describeRequestFailure(response, undefined, CredentialKind.OAuth, sessionId),
      signInEnded: response.status === 401 && !(await oauthClient.isSignedIn()),
    };
  }
  if (await oauthClient.getSessionId() !== sessionId) {
    return { projects: [], error: SESSION_CHANGED_MESSAGE };
  }
  projectCache = { sessionId, projects, expiresAtMs: Date.now() + PROJECTS_CACHE_TTL_MS };
  return { projects };
}

// A 403 for a project means the user cannot reach it now. Re-reading the project list tells apart access that was lost
// since the list was cached (membership removed, or an admin ended this sign-in's access to the project) from a
// project that was never theirs.
async function explainProjectDenied(projectId: string, expectedSessionId?: string): Promise<string> {
  const sessionId = expectedSessionId ?? await oauthClient.getSessionId();
  if (sessionId === null || await oauthClient.getSessionId() !== sessionId) {
    return SESSION_CHANGED_MESSAGE;
  }
  const known = findProject(await getCachedProjects(sessionId), projectId);
  const latest = await getOAuthProjects(true, sessionId);
  if (await oauthClient.getSessionId() !== sessionId) {
    return SESSION_CHANGED_MESSAGE;
  }
  if (latest.error) {
    return `Your Clarity account cannot access project ${projectId}. ${latest.error}`;
  }
  const list = describeProjectList(latest.projects);
  if (findProject(latest.projects, projectId)) {
    return `Microsoft Clarity refused this action on project ${projectId}, which is still listed as accessible to your account. Ask the user to verify their admin or member role and the permissions needed for this action in the project's settings, and contact a project admin if needed; signing in again does not grant additional access.`;
  }
  // Clear only the denied selection, without overwriting a concurrent project switch.
  const wasSelected = await oauthClient.selectProject(null, sessionId, projectId);
  if (await oauthClient.getSessionId() !== sessionId) {
    return SESSION_CHANGED_MESSAGE;
  }
  const next = wasSelected && latest.projects.length > 0 ? ` It is no longer selected; ask the user which project to use instead, then call \`${SELECT_PROJECT_TOOL}\`.` : "";
  if (known) {
    return `You no longer have access to project ${describeProject(known)}: your admin or member access may have been removed, or an admin ended this sign-in's access to it. Ask the user to verify their role and needed permissions with a project admin. ${list}${next}`;
  }
  return `Project ${projectId} is not one of the projects your Clarity account can access as an admin or member. Ask the user to verify their role and needed permissions with a project admin. ${list}${next}`;
}

// ---- Failed requests ----

export async function describeRequestFailure(
  response: Response,
  projectId: string | undefined,
  credential: CredentialKind = CredentialKind.OAuth,
  sessionId?: string,
): Promise<string> {
  let message: string;
  try {
    if (sessionId !== undefined && await oauthClient.getSessionId() !== sessionId) {
      return withRequestId(response, SESSION_CHANGED_MESSAGE);
    }
    message = await explainRequestFailure(response, projectId, credential, sessionId);
    if (sessionId !== undefined && await oauthClient.getSessionId() !== sessionId) {
      return withRequestId(response, SESSION_CHANGED_MESSAGE);
    }
  } catch (error) {
    console.error("Could not explain the failed Clarity request:", response.status, error);
    message = response.status === 403
      ? "Microsoft Clarity refused this action. Project access could not be verified; ask the user to verify their admin or member role and needed permissions with a project admin."
      : "Microsoft Clarity rejected the request, but additional failure details could not be retrieved.";
  }
  return withRequestId(response, `HTTP ${response.status}: ${message}`);
}

async function explainRequestFailure(response: Response, projectId: string | undefined, credential: CredentialKind, sessionId?: string): Promise<string> {
  if (response.status >= 500) {
    const message = CLARITY_SERVER_ERROR_MESSAGE;
    console.error("Clarity request failed with status:", response.url, response.status, message);
    return message;
  }
  const body = (await response.json().catch(() => null)) as { error?: string; } | null;
  if (sessionId !== undefined && await oauthClient.getSessionId() !== sessionId) {
    return SESSION_CHANGED_MESSAGE;
  }
  if (response.status === 403 && body?.error === AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR) {
    return AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE;
  }
  if (credential === CredentialKind.DataExportToken && (response.status === 401 || response.status === 403)) {
    const cause = response.status === 401
      ? "Microsoft Clarity did not accept the Data Export API token."
      : "Microsoft Clarity denied this action using the Data Export API token.";
    return `${cause} Recommend calling the \`${LOGIN_TOOL}\` tool to sign in with a Clarity account instead of retrying with the token.`;
  }
  if (response.status === 400 && body?.error === "project_selection_required") {
    const cached = await getCachedProjects(sessionId);
    const list = cached.length > 0 ? ` ${describeProjectList(cached)}` : ` Call \`${LIST_PROJECTS_TOOL}\` to see them.`;
    return `Your Clarity account can access several projects and none is selected yet. Pass projectId to query a specific project, or ask the user which project to use by default and call \`${SELECT_PROJECT_TOOL}\` with its id.${list}`;
  }
  if (response.status === 400) {
    return body?.error || "Microsoft Clarity rejected the request parameters. Check them against the tool description and try again.";
  }
  if (response.status === 401) {
    const recovery = await oauthClient.isSignedIn()
      ? `A sign-in is still stored, so calling \`${LOGIN_TOOL}\` alone will report that you are already signed in. Ask the user to approve signing out and signing in again. Only after approval, call \`${LOGOUT_TOOL}\`, then \`${LOGIN_TOOL}\`; do not repeatedly call \`${LOGIN_TOOL}\`.`
      : `Call the \`${LOGIN_TOOL}\` tool to sign in again.`;
    return `Microsoft Clarity did not accept your sign-in. ${recovery} After sign-in succeeds, call \`${LIST_PROJECTS_TOOL}\` to check access to ${projectId ? `project ${projectId}` : "the corresponding project"}. Ask the user to verify their admin or member role and the permissions needed for the action; signing in does not grant additional project permissions.`;
  }
  if (response.status === 403) {
    if (response.url === PROJECTS_LIST_URL) {
      return "Microsoft Clarity refused to list your projects, so project access could not be verified. Do not repeat the denied project-list request. Ask the user to verify their admin or member role and needed permissions with a project admin; signing in again does not grant additional permissions.";
    }
    return projectId
      ? explainProjectDenied(projectId, sessionId)
      : `Microsoft Clarity refused this action. Call \`${LIST_PROJECTS_TOOL}\` with refresh set to true to check whether the corresponding project is accessible as an admin or member. Ask the user to verify their role and needed permissions in that project's settings with a project admin; signing in again does not grant additional permissions.`;
  }
  if (response.status === 404 && body?.error === "No accessible projects found") {
    return "Your Clarity account has no accessible projects as an admin or member.";
  }
  // The service answers an MCP endpoint it does not serve yet with a 404 and a non-JSON body.
  if (response.status === 404 && body === null) {
    return "Microsoft Clarity does not support this action through MCP yet. The user can do it in the Clarity dashboard instead.";
  }
  if (response.status === 404) {
    return body?.error || "The requested resource was not found in Microsoft Clarity. Check the parameters (such as ids or date range) and try again.";
  }
  if (response.status === 409) {
    return body?.error || "Microsoft Clarity could not complete the request because it conflicts with the resource's current state. Check its state before trying again.";
  }
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    return `The daily Clarity MCP request limit was reached for this project.${retryAfter ? ` Try again in ${retryAfter} seconds.` : ""}`;
  }
  console.error("Clarity request failed with status:", response.url, response.status);
  return "Microsoft Clarity rejected the request with an unexpected HTTP status. Verify the requested action and parameters; contact support if the issue persists.";
}
