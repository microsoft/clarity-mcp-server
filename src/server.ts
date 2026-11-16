import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import pkg from "../package.json" with { type: "json" };
import { registerAnalyticsTools } from "./features/analytics/tools.js";
import { registerAuthTools } from "./features/auth/tools.js";
import { registerBotActivityTools } from "./features/bot-activity/tools.js";
import { registerCitationTools } from "./features/citations/tools.js";
import { registerDocumentationTools } from "./features/documentation/tools.js";
import { registerProjectTools } from "./features/projects/tools.js";
import { registerRecordingTools } from "./features/recordings/tools.js";
import { registerTopicInsightTools } from "./features/topic-insights/tools.js";
import { SYSTEM_INSTRUCTIONS_PROMPT } from "./instructions.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: pkg.name,
      version: pkg.version,
    },
    {
      instructions: SYSTEM_INSTRUCTIONS_PROMPT,
    }
  );

  // Register tool families.
  registerAnalyticsTools(server);
  registerRecordingTools(server);
  registerCitationTools(server);
  registerBotActivityTools(server);
  registerTopicInsightTools(server);
  registerProjectTools(server);
  registerDocumentationTools(server);
  registerAuthTools(server);

  return server;
}
