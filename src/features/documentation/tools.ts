import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApiUrl } from "../../config.js";
import { callClarityApi, type CallOptions } from "../../mcp/client.js";
import { SearchRequest } from "./schemas.js";

// --- Query Documentation Resources ---

export const DOCUMENTATION_TOOL = "query-documentation-resources";
export const DOCUMENTATION_URL = mcpApiUrl("/documentation/query");
export const DOCUMENTATION_DESCRIPTION = "Retrieve Microsoft Clarity documentation snippets for finding answers to user questions including step-by-step screenshots for setup guides, features, usage, troubleshooting, and integration instructions. The query should be focused on one specific documentation topic or question. Avoid complex multi-purpose queries.";

function registerQueryDocumentationResourcesTool(server: McpServer): void {
  server.tool(
    DOCUMENTATION_TOOL,                           /* Name */
    DOCUMENTATION_DESCRIPTION,                    /* Description */
    SearchRequest,                                /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Query Documentation Resources",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ query }) => {
      const requestBody = {
        query: query,
      };
      const callOptions: CallOptions = { noProject: true };

      return await callClarityApi(DOCUMENTATION_URL, requestBody, callOptions);
    }
  );
}

// --- Registration ---

export function registerDocumentationTools(server: McpServer): void {
  registerQueryDocumentationResourcesTool(server);
}
