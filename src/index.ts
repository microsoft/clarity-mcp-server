import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import pkg from "../package.json" with { type: "json" };

import {
  ANALYTICS_DASHBOARD_DESCRIPTION,
  ANALYTICS_DASHBOARD_TOOL,
  CLARITY_API_TOKEN,
  DOCUMENTATION_DESCRIPTION,
  DOCUMENTATION_TOOL,
  SESSION_RECORDINGS_DESCRIPTION,
  SESSION_RECORDINGS_TOOL
} from "./constants.js";
import {
  SYSTEM_INSTRUCTIONS_PROMPT
} from "./instructions.js";
import {
  listSessionRecordingsAsync,
  queryAnalyticsDashboardAsync,
  queryDocumentationAsync
} from "./tools.js";
import {
  ListRequest,
  SearchRequest,
} from "./types.js";

// Create server instance
const server = new McpServer(
  {
    name: pkg.name,
    version: pkg.version,
    capabilities: {
      resources: {},
      tools: {}
    },
  },
  {
    instructions: SYSTEM_INSTRUCTIONS_PROMPT,
  }
);

// Register the query-analytics-data tool
server.tool(
  ANALYTICS_DASHBOARD_TOOL,             /* Name */
  ANALYTICS_DASHBOARD_DESCRIPTION,      /* Description */
  SearchRequest,                        /* Parameter Schema */
  {                                     /* Metadata & Annotations */
    title: "Query Analytics Dashboard",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  async ({ query }) => {
    return await queryAnalyticsDashboardAsync(query, Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
);

// Register the session-recordings tool
server.tool(
  SESSION_RECORDINGS_TOOL,              /* Name */
  SESSION_RECORDINGS_DESCRIPTION,       /* Description */
  ListRequest,                          /* Parameter Schema */
  {                                     /* Metadata & Annotations */
    title: "List Session Recordings",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  async ({ filters, sortBy, count }) => {
    const now = new Date().toISOString();

    // Calculate end as now, start as now - numOfDays
    const endDate = new Date(filters?.date?.end || now);
    const startDate = new Date(filters?.date?.start || now);

    if (!filters?.date?.start) {
      startDate.setDate(endDate.getDate() - 2);
    }

    return await listSessionRecordingsAsync(startDate, endDate, filters, sortBy, count);
  }
);

// Register the query-documentation-resources tool
server.tool(
  DOCUMENTATION_TOOL,                   /* Name */
  DOCUMENTATION_DESCRIPTION,            /* Description */
  SearchRequest,                        /* Parameter Schema */
  {                                     /* Metadata & Annotations */
    title: "Query Documentation Resources",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  async ({ query }) => {
    return await queryDocumentationAsync(query);
  }
);

// Main function
async function main() {
  // Log configuration status
  if (CLARITY_API_TOKEN) {
    console.error("Clarity API token configured via environment/command-line");
  } else {
    console.error("No Clarity API token configured, it must be provided with each request");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Microsoft Clarity Data Export MCP Server running on stdio...");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
