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
    console.error(
      "Deprecation warning: Data Export API token authentication for MCP is being deprecated.\n" +
      "Remove CLARITY_API_TOKEN or --clarity_api_token from your configuration and use the login tool to sign in with your Microsoft Clarity account.\n"
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Microsoft Clarity MCP Server running on stdio...");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
