import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import pkg from "../package.json" with { type: "json" };

import {
  ANALYTICS_DASHBOARD_DESCRIPTION,
  ANALYTICS_DASHBOARD_TOOL,
  DOCUMENTATION_DESCRIPTION,
  DOCUMENTATION_TOOL,
  LIST_ACCOUNTS_DESCRIPTION,
  LIST_ACCOUNTS_TOOL,
  SESSION_RECORDINGS_DESCRIPTION,
  SESSION_RECORDINGS_TOOL
} from "./constants.js";
import {
  SYSTEM_INSTRUCTIONS_PROMPT
} from "./instructions.js";
import {
  listConfiguredAccounts,
  listSessionRecordingsAsync,
  queryAnalyticsDashboardAsync,
  queryDocumentationAsync
} from "./tools.js";
import {
  ListRequest,
  SearchRequest,
} from "./types.js";
import { loadAccounts } from "./accounts.js";

// Account parameter — added to data-fetching tools
const AccountParam = z.string().optional().describe(
  "The domain name of the Clarity project/account to query (e.g., 'crowntrophy.com', 'zenworkflow.app'). " +
  "Use the list-clarity-accounts tool to see available accounts. " +
  "If omitted, the default account is used."
);

// Create server instance
const server = new McpServer(
  {
    name: pkg.name,
    version: pkg.version,
  
  },
  {
    instructions: SYSTEM_INSTRUCTIONS_PROMPT,
  }
);

// Register the list-accounts tool
server.tool(
  LIST_ACCOUNTS_TOOL,
  LIST_ACCOUNTS_DESCRIPTION,
  {},
  {
    title: "List Clarity Accounts",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  async () => {
    return listConfiguredAccounts();
  }
);

// Register the query-analytics-dashboard tool
server.tool(
  ANALYTICS_DASHBOARD_TOOL,
  ANALYTICS_DASHBOARD_DESCRIPTION,
  {
    ...SearchRequest,
    account: AccountParam,
  },
  {
    title: "Query Analytics Dashboard",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  async ({ query, account }) => {
    return await queryAnalyticsDashboardAsync(query, Intl.DateTimeFormat().resolvedOptions().timeZone, account);
  }
);

// Register the session-recordings tool
server.tool(
  SESSION_RECORDINGS_TOOL,
  SESSION_RECORDINGS_DESCRIPTION,
  {
    ...ListRequest,
    account: AccountParam,
  },
  {
    title: "List Session Recordings",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false
  },
  async ({ filters, sortBy, count, account }) => {
    const now = new Date().toISOString();

    const endDate = new Date(filters?.date?.end || now);
    const startDate = new Date(filters?.date?.start || now);

    if (!filters?.date?.start) {
      startDate.setDate(endDate.getDate() - 2);
    }

    return await listSessionRecordingsAsync(startDate, endDate, filters, sortBy, count, account);
  }
);

// Register the query-documentation-resources tool
server.tool(
  DOCUMENTATION_TOOL,
  DOCUMENTATION_DESCRIPTION,
  SearchRequest,
  {
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
  const config = loadAccounts();
  const accountCount = Object.keys(config.accounts).length;

  if (accountCount > 0) {
    console.error(`Loaded ${accountCount} Clarity account(s): ${Object.keys(config.accounts).join(", ")}`);
    if (config.default) {
      console.error(`Default account: ${config.default}`);
    }
  } else {
    console.error("No Clarity accounts configured. Use ~/.clarity-mcp/accounts.json or --clarity_api_token");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Clarity MCP Server (multi-account) running on stdio...");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
