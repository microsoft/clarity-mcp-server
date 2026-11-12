import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { oauthClient } from "./auth/oauth.js";
import { CLARITY_API_TOKEN } from "./config.js";
import { prefetchProjects } from "./projects/service.js";
import { createServer } from "./server.js";

const server = createServer();

// Main function
async function main() {
  oauthClient.onSignIn(prefetchProjects);

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
