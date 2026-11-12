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
import { LOGIN_TOOL } from "../features/auth/tools.js";
import { LIST_PROJECTS_TOOL, SELECT_PROJECT_TOOL } from "../features/projects/tools.js";
import {
  AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR,
  AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE,
  getServerErrorMessage,
} from "../mcp/messages.js";
import { type ToolResult, textResult } from "../mcp/results.js";
import type { ProjectsResponse, ProjectSummary } from "./models.js";
import { describeProject, describeProjectList, findProject } from "./utils.js";

export const PROJECTS_LIST_URL = mcpApiUrl("/projects/list");

// How long the signed-in user's project list is reused. Checked only when a tool runs; nothing refreshes in the background,
// so an idle chat makes no requests and the first use after expiry re-reads the list.
export const PROJECTS_CACHE_TTL_MS = 10 * 60 * 1000;

// The signed-in user's Clarity projects: the project tools, the per-sign-in project cache, and explanations of failed
// requests, most of which depend on the user's projects.

// The projects the signed-in user can query, from a per-sign-in cache. Needs a sign-in: a Data Export token cannot list projects.
export async function listProjects(refresh = false): Promise<ToolResult> {
  const credential = await getActiveCredential();
  if (credential === CredentialKind.OAuth) {
    const outcome = await getOAuthProjects(refresh);
    if (!outcome.error) {
      return textResult(JSON.stringify({ projects: outcome.projects, ...(await describeSelection(outcome.projects)) }, null, 2));
    }
    // When the sign-in has just ended and a token is configured, the tools fall back to the token.
    if (!(outcome.signInEnded && CLARITY_API_TOKEN)) {
      return textResult(outcome.error, true);
    }
  }
  return textResult(CLARITY_API_TOKEN ? getDataExportTokenSingleProjectMessage() : getNotSignedInMessage(), true);
}

// The signed-in user's projects and selected project for the sign-in status, or why they could not be listed.
export async function getSignedInProjects(): Promise<object> {
  try {
    const outcome = await getOAuthProjects(false);
    return outcome.error ? { projectsError: outcome.error } : { projects: outcome.projects, ...(await describeSelection(outcome.projects)) };
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
    let outcome = await getOAuthProjects(false);
    let project = findProject(outcome.projects, projectId);
    if (!outcome.error && !project) {
      // The user may have just gained access to it.
      outcome = await getOAuthProjects(true);
      project = findProject(outcome.projects, projectId);
    }
    if (outcome.error) {
      return textResult(outcome.error, true);
    }
    if (!project) {
      return textResult(`Project ${projectId} is not one of the projects your Clarity account can access as an admin or member. ${describeProjectList(outcome.projects)}`, true);
    }
    if (!(await oauthClient.selectProject(project.projectId))) {
      return textResult(getNotSignedInMessage(), true);
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
async function describeSelection(projects: readonly ProjectSummary[]): Promise<{ selectedProject: ProjectSummary | null; }> {
  const selectedId = await oauthClient.getSelectedProjectId();
  const selected = selectedId ? findProject(projects, selectedId) ?? { projectId: selectedId, name: null, hostname: null } : null;
  return { selectedProject: selected ?? (projects.length === 1 ? projects[0]! : null) };
}

// ---- Project cache ----

// The list only helps the assistant match names to ids; the service still checks access on every call, so a stale entry
// can never grant access. It is keyed by sign-in, so signing out or in as someone else (in any process) drops it.
let projectCache: { sessionId: string; projects: ProjectSummary[]; expiresAtMs: number; } | null = null;

let projectFetch: { sessionId: string; promise: Promise<ProjectsResponse>; } | null = null;

async function getOAuthProjects(refresh: boolean): Promise<ProjectsResponse> {
  const sessionId = await oauthClient.getSessionId();
  if (sessionId === null) {
    projectCache = null;
    return { projects: [], error: getNotSignedInMessage() };
  }
  if (!refresh && projectCache?.sessionId === sessionId && projectCache.expiresAtMs > Date.now()) {
    return { projects: projectCache.projects };
  }
  if (projectFetch?.sessionId !== sessionId) {
    const promise = fetchOAuthProjects(sessionId).finally(() => {
      if (projectFetch?.promise === promise) {
        projectFetch = null;
      }
    });
    projectFetch = { sessionId, promise };
  }
  return projectFetch.promise;
}

async function fetchOAuthProjects(sessionId: string): Promise<ProjectsResponse> {
  const response = await sendWithOAuth(PROJECTS_LIST_URL, {}, undefined);
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
    return { projects: [], error: await describeOAuthFailure(response, undefined) };
  }
  projectCache = { sessionId, projects, expiresAtMs: Date.now() + PROJECTS_CACHE_TTL_MS };
  return { projects };
}

// A 403 for a project means the user cannot reach it now. Re-reading the project list tells apart access that was lost
// since the list was cached (membership removed, or an admin ended this sign-in's access to the project) from a
// project that was never theirs.
async function explainProjectDenied(projectId: string): Promise<string> {
  const known = findProject(projectCache?.projects ?? [], projectId);
  const latest = await getOAuthProjects(true);
  if (latest.error) {
    return `Your Clarity account cannot access project ${projectId}. ${latest.error}`;
  }
  const list = describeProjectList(latest.projects);
  if (findProject(latest.projects, projectId)) {
    return `Microsoft Clarity refused this action on project ${projectId}. Requests are restricted by your admin or member permissions for this project. Ask a project admin to check your permissions; signing in again does not grant additional access.`;
  }
  // Forget the selection so the next request does not hit the same refusal; the user picks another project.
  const wasSelected = (await oauthClient.getSelectedProjectId())?.toLowerCase() === projectId.toLowerCase();
  if (wasSelected) {
    await oauthClient.selectProject(null);
  }
  const next = wasSelected && latest.projects.length > 0 ? ` It is no longer selected; ask the user which project to use instead, then call \`${SELECT_PROJECT_TOOL}\`.` : "";
  if (known) {
    return `You no longer have access to project ${describeProject(known)}: your admin or member access may have been removed, or an admin ended this sign-in's access to it. ${list}${next}`;
  }
  return `Project ${projectId} is not one of the projects your Clarity account can access as an admin or member. ${list}${next}`;
}

// ---- Failed requests ----

export async function describeOAuthFailure(response: Response, projectId: string | undefined): Promise<string> {
  if (response.status >= 500) {
    const message = getServerErrorMessage(response);
    console.error("Clarity request failed with status:", response.url, response.status, message);
    return message;
  }
  const body = (await response.json().catch(() => null)) as { error?: string; } | null;
  if (response.status === 400 && body?.error === "project_selection_required") {
    const cached = projectCache?.projects ?? [];
    const list = cached ? ` ${describeProjectList(cached)}` : ` Call \`${LIST_PROJECTS_TOOL}\` to see them.`;
    return `Your Clarity account can access several projects and none is selected yet. Pass projectId to query a specific project, or ask the user which project to use by default and call \`${SELECT_PROJECT_TOOL}\` with its id.${list}`;
  }
  if (response.status === 400) {
    return body?.error || "Microsoft Clarity rejected the request parameters. Check them against the tool description and try again.";
  }
  if (response.status === 401) {
    return `Your Microsoft Clarity sign-in is no longer valid. Call the \`${LOGIN_TOOL}\` tool to sign in again.`;
  }
  if (response.status === 403) {
    if (body?.error === AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR) {
      return AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE;
    }
    return projectId
      ? explainProjectDenied(projectId)
      : "Microsoft Clarity refused this action. Requests are restricted by your admin or member permissions for the project. Ask a project admin to check your access; signing in again does not grant additional permissions.";
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
  return "An error occurred while fetching the data.";
}
