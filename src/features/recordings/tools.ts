import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApiUrl } from "../../config.js";
import { callClarityApi, type CallOptions } from "../../mcp/client.js";
import { ListRequest, SortOptionsEnum } from "./schemas.js";

// --- List Session Recordings ---

export const SESSION_RECORDINGS_TOOL = "list-session-recordings";
export const SESSION_RECORDINGS_URL = mcpApiUrl("/recordings/sample");
export const SESSION_RECORDINGS_DESCRIPTION = "List Microsoft Clarity session recordings based on specified filters. The filters allow you to narrow down the recordings by various criteria such as URLs, device types, browser, OS, country, city, and more. The date filter is required and must be in UTC ISO 8601 format.";

function registerListSessionRecordingsTool(server: McpServer): void {
  server.tool(
    SESSION_RECORDINGS_TOOL,                      /* Name */
    SESSION_RECORDINGS_DESCRIPTION,               /* Description */
    ListRequest,                                  /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Session Recordings",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, sortBy, count, projectId }) => {
      const now = new Date().toISOString();

      // Calculate end as now, start as now - numOfDays
      const endDate = new Date(filters?.date?.end || now);
      const startDate = new Date(filters?.date?.start || now);

      if (!filters?.date?.start) {
        startDate.setDate(endDate.getDate() - 2);
      }

      const requestBody = {
        sortBy: SortOptionsEnum[sortBy],
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        filters: filters,
        count: count
      };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(SESSION_RECORDINGS_URL, requestBody, callOptions);
    }
  );
}

// --- Registration ---

export function registerRecordingTools(server: McpServer): void {
  registerListSessionRecordingsTool(server);
}
