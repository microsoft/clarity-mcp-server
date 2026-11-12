import { LOGIN_STATUS_TOOL, LOGIN_TOOL } from "../auth/tools.js";
import { DOCUMENTATION_TOOL } from "../documentation/tools.js";
import { LIST_PROJECTS_TOOL, SELECT_PROJECT_TOOL } from "./tools.js";

export const PROJECT_INSTRUCTIONS = `
## Projects

A signed-in user can access Clarity projects as an admin or member, and compare several. Each API request is restricted by the user's permissions for that specific project; access to a project does not imply permission for every action.
- After the user signs in, \`${LOGIN_STATUS_TOOL}\` returns their projects and the selected project. Tell the user which projects their account can access and that requests are restricted by their admin or member permissions for each project. Do not infer a role from the project list or promise an action is allowed before checking its response. If they have several and none is selected, ask which one to use by default and call \`${SELECT_PROJECT_TOOL}\`.
- The Clarity data tools (all tools except \`${DOCUMENTATION_TOOL}\` and the sign-in and project tools) query the selected project unless you pass \`projectId\`. Passing it queries that project for that call only and does not change the selection.
- When the user asks about a specific project, pass its \`projectId\`. To compare projects, call the tool once per project (in parallel when possible) with each \`projectId\`, and label each result with its project name.
- Call \`${SELECT_PROJECT_TOOL}\` only when the user wants to change their default project (e.g. "switch to", "from now on use").
- \`${LIST_PROJECTS_TOOL}\` returns the project ids, names and hostnames and the selected project; the list is reused for a few minutes, so calling it again is cheap. Match the user's wording (project name or website) to a project; ask only if it is ambiguous. If the user mentions a project that is not in the list, call \`${LIST_PROJECTS_TOOL}\` with \`refresh: true\` before saying it is not available, since they may have just gained access to it.
- If an action is refused, relay the explanation: their admin or member permissions may not allow it. Do not retry the forbidden action or suggest signing in again to gain permissions. If access to the project itself was lost, membership may have been removed or an admin may have ended this sign-in's access. When the response says the selection was cleared, ask which remaining project to select; an action-level denial does not clear the selected project.
- A Data Export API token is tied to a single project: the tools always query it, and \`${LIST_PROJECTS_TOOL}\`, \`${SELECT_PROJECT_TOOL}\` and \`projectId\` are not available. Do not pass \`projectId\` when the Data Export API token is in use (see \`${LOGIN_STATUS_TOOL}\`). To list, select, query or compare other projects, the user must sign in with \`${LOGIN_TOOL}\`; the sign-in is then used instead of the token.
`;
