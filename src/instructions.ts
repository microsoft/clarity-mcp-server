import { ANALYTICS_INSTRUCTIONS } from "./features/analytics/instructions.js";
import { AUTH_INSTRUCTIONS } from "./features/auth/instructions.js";
import { BOT_ACTIVITY_INSTRUCTIONS } from "./features/bot-activity/instructions.js";
import { CITATION_INSTRUCTIONS } from "./features/citations/instructions.js";
import { DOCUMENTATION_INSTRUCTIONS } from "./features/documentation/instructions.js";
import { PROJECT_INSTRUCTIONS } from "./features/projects/instructions.js";
import { RECORDING_INSTRUCTIONS } from "./features/recordings/instructions.js";
import { TOPIC_INSIGHT_INSTRUCTIONS } from "./features/topic-insights/instructions.js";

export const SYSTEM_INSTRUCTIONS_PROMPT = `
This MCP server provides access to Microsoft Clarity analytics dashboard data, AI Visibility citations, bot activity and topic insights, documentation resources and session recordings.

${AUTH_INSTRUCTIONS}
${PROJECT_INSTRUCTIONS}

## Available Tools

${RECORDING_INSTRUCTIONS}
${ANALYTICS_INSTRUCTIONS}
${DOCUMENTATION_INSTRUCTIONS}

### AI Visibility Tools

AI Visibility helps users understand how AI experiences surface their brand: where content is cited, which queries trigger citations, which sources are trusted, and how AI bots reach their site.
It connects this discovery data to Clarity engagement data, helping users prioritize content improvements.
Use AI Visibility tools only for questions about a project's AI Visibility data.

Like the other Clarity data tools, the AI Visibility tools query the selected project unless you pass \`projectId\`.

${CITATION_INSTRUCTIONS}
${BOT_ACTIVITY_INSTRUCTIONS}
${TOPIC_INSIGHT_INSTRUCTIONS}

## API Failures

If a tool reports an internal server error, relay its message and include the request ID exactly as returned so the user can share it with support. Do not invent a request ID when none is provided or expose internal error details.
`;
