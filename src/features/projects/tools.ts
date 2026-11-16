import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listProjects, selectProject } from "../../projects/service.js";
import { ANALYTICS_DASHBOARD_TOOL } from "../analytics/tools.js";
import { SESSION_RECORDINGS_TOOL } from "../recordings/tools.js";
import { ListProjectsRequest, SelectProjectRequest } from "./schemas.js";

// --- List Clarity Projects ---

export const LIST_PROJECTS_TOOL = "list-projects";
export const LIST_PROJECTS_DESCRIPTION = "List the Microsoft Clarity projects the signed-in user can access as an admin or member, with each project's id, name and hostname, and which one is selected. Each API request is restricted by the user's permissions for that project; being listed does not grant every action. The list is reused for a few minutes; pass refresh: true to re-read it, e.g. after the user gains access to a new project. Requires a Clarity sign-in: not available with a Data Export API token, which is tied to a single project.";

function registerListProjectsTool(server: McpServer): void {
  server.tool(
    LIST_PROJECTS_TOOL,                           /* Name */
    LIST_PROJECTS_DESCRIPTION,                    /* Description */
    ListProjectsRequest,                          /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Clarity Projects",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ refresh }) => {
      return await listProjects(refresh ?? false);
    }
  );
}

// --- Select Clarity Project ---

export const SELECT_PROJECT_TOOL = "select-project";
export const SELECT_PROJECT_DESCRIPTION = () => `Select the user's default Microsoft Clarity project: the one the Clarity data tools (such as ${ANALYTICS_DASHBOARD_TOOL} and ${SESSION_RECORDINGS_TOOL}) query when no projectId is passed. The choice is remembered for this sign-in until another one is selected. Call it when the user chooses a default project or asks to switch their default; to query or compare other projects without changing the default, pass projectId to those tools instead. Take the project id from ${LIST_PROJECTS_TOOL}. Not used with a Data Export API token, which is tied to one project.`;

function registerSelectProjectTool(server: McpServer): void {
  server.tool(
    SELECT_PROJECT_TOOL,                          /* Name */
    SELECT_PROJECT_DESCRIPTION(),                 /* Description */
    SelectProjectRequest,                         /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Select Clarity Project",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ projectId }) => {
      return await selectProject(projectId);
    }
  );
}

// --- Registration ---

export function registerProjectTools(server: McpServer): void {
  registerListProjectsTool(server);
  registerSelectProjectTool(server);
}
