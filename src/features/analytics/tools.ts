import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApiUrl } from "../../config.js";
import { callClarityApi, type CallOptions } from "../../mcp/client.js";
import { AnalyticsRequest } from "./schemas.js";

// --- Query Analytics Dashboard ---

export const ANALYTICS_DASHBOARD_TOOL = "query-analytics-dashboard";
export const ANALYTICS_DASHBOARD_URL = mcpApiUrl("/dashboard/query");
export const ANALYTICS_DASHBOARD_DESCRIPTION = "Fetch Microsoft Clarity analytics data using a simplified natural language search query. The query should be focused on one specific data retrieval or aggregation task. Avoid complex multi-purpose queries. Time ranges should be explicitly specified when possible. If no time range is provided, prompt the user to specify one. Do NOT use this tool for AI bot, crawler, or crawling-activity questions (which bots or AI crawlers accessed the site, crawled paths, content or page types, HTTP status codes, robots.txt violations, or scrape-to-referral) - use the dedicated Bot Activity tools for those instead.";

function registerQueryAnalyticsDashboardTool(server: McpServer): void {
  server.tool(
    ANALYTICS_DASHBOARD_TOOL,                     /* Name */
    ANALYTICS_DASHBOARD_DESCRIPTION,              /* Description */
    AnalyticsRequest,                             /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Query Analytics Dashboard",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ query, projectId }) => {
      const requestBody = {
        query: query,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(ANALYTICS_DASHBOARD_URL, requestBody, callOptions);
    }
  );
}

// --- Registration ---

export function registerAnalyticsTools(server: McpServer): void {
  registerQueryAnalyticsDashboardTool(server);
}
