import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApiUrl } from "../../config.js";
import { callClarityApi, type CallOptions } from "../../mcp/client.js";
import {
  CreateTopicInsightRequest,
  DeleteTopicInsightRequest,
  RegenerateTopicInsightRequest,
  TopicInsightConstraintsRequest,
  TopicInsightReportRequest,
  TopicInsightsListRequest,
  TopicInsightStatusRequest,
} from "./schemas.js";

// --- Get Topic Insight Constraints ---

export const TOPIC_INSIGHTS_CONSTRAINTS_TOOL = "get-topic-insight-constraints";
export const TOPIC_INSIGHTS_CONSTRAINTS_URL = mcpApiUrl("/topic-insights/constraints");
export const TOPIC_INSIGHTS_CONSTRAINTS_DESCRIPTION = () => `Get the current validation rules for Topic Insights: the maximum topic name length, the allowed range of questions per topic, the allowed question length, the maximum number of reports a project can generate in a 7-day window, and the per-topic regeneration cooldown in days. Call this before ${TOPIC_INSIGHTS_CREATE_TOOL} or ${TOPIC_INSIGHTS_REGENERATE_TOOL} and state the rules to the user before collecting their input, so their topic and questions satisfy the rules on the first try. Requires a verified AI Visibility domain.`;

function registerGetTopicInsightConstraintsTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_CONSTRAINTS_TOOL,              /* Name */
    TOPIC_INSIGHTS_CONSTRAINTS_DESCRIPTION(),     /* Description */
    TopicInsightConstraintsRequest,               /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Topic Insight Constraints",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ projectId }) => {
      const requestBody = {};
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_CONSTRAINTS_URL, requestBody, callOptions);
    },
  );
}

// --- List Topic Insights ---

export const TOPIC_INSIGHTS_LIST_TOOL = "list-topic-insights";
export const TOPIC_INSIGHTS_LIST_URL = mcpApiUrl("/topic-insights/list");
export const TOPIC_INSIGHTS_LIST_DESCRIPTION = "List the Topic Insight (AI Economy simulation) topics for the Clarity project. Returns two groups matching the dashboard: topics (the user's own topics - approved or already generated) and suggestedTopics (auto-generated topic suggestions the user has not adopted yet). Each entry has topicId, topicName, userApproved, questions, and its generated reports (runId, status, citationRate, competitiveShare). Also returns reportsMetadata (canGenerate and the number of reports generated in the current window). Treat suggestedTopics as suggestions, not the user's active topics, unless they ask about suggestions. Requires a verified AI Visibility domain.";

function registerListTopicInsightsTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_LIST_TOOL,                     /* Name */
    TOPIC_INSIGHTS_LIST_DESCRIPTION,              /* Description */
    TopicInsightsListRequest,                     /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Topic Insights",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ projectId }) => {
      const requestBody = {};
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_LIST_URL, requestBody, callOptions);
    },
  );
}

// --- Get Topic Insight Report ---

export const TOPIC_INSIGHTS_REPORT_TOOL = "get-topic-insight-report";
export const TOPIC_INSIGHTS_REPORT_URL = mcpApiUrl("/topic-insights/report");
export const TOPIC_INSIGHTS_REPORT_DESCRIPTION = "Get a completed Topic Insight report for one topic (topicId required, runId optional for a specific run; omitted selects the latest completed run). Returns the resolved runId, status, dataReady, simulation metrics (citation rate, competitive share, answer/citation counts), per-domain ranking, content strengths/opportunities, and simulated questions. In-progress runs cannot be read as final reports. If dataReady=false, wait for ingestion and do not interpret metrics. Requires a verified AI Visibility domain.";

function registerGetTopicInsightReportTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_REPORT_TOOL,                   /* Name */
    TOPIC_INSIGHTS_REPORT_DESCRIPTION,            /* Description */
    TopicInsightReportRequest,                    /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Topic Insight Report",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ topicId, runId, projectId }) => {
      const requestBody = { topicId, runId };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_REPORT_URL, requestBody, callOptions);
    },
  );
}

// --- Get Topic Insight Status ---

export const TOPIC_INSIGHTS_STATUS_TOOL = "get-topic-insight-status";
export const TOPIC_INSIGHTS_STATUS_URL = mcpApiUrl("/topic-insights/status");
export const TOPIC_INSIGHTS_STATUS_DESCRIPTION = () => `Get the generation status for one or more Topic Insight runs (runIds required). Returns each run's status, progress percentage, and - once completed - its citation rate and competitive share. Poll this after ${TOPIC_INSIGHTS_CREATE_TOOL} or ${TOPIC_INSIGHTS_REGENERATE_TOOL} until the status is Completed, then call ${TOPIC_INSIGHTS_REPORT_TOOL}.`;

function registerGetTopicInsightStatusTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_STATUS_TOOL,                   /* Name */
    TOPIC_INSIGHTS_STATUS_DESCRIPTION(),          /* Description */
    TopicInsightStatusRequest,                    /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Topic Insight Status",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ runIds, projectId }) => {
      const requestBody = { runIds };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_STATUS_URL, requestBody, callOptions);
    },
  );
}

// --- Create Topic Insight Report ---

export const TOPIC_INSIGHTS_CREATE_TOOL = "create-topic-insight-report";
export const TOPIC_INSIGHTS_CREATE_URL = mcpApiUrl("/topic-insights/create");
export const TOPIC_INSIGHTS_CREATE_DESCRIPTION = () => `Create a new Topic Insight topic and start generating its report. Call ${TOPIC_INSIGHTS_CONSTRAINTS_TOOL} first and state its rules to the user before collecting the topic name and questions. Returns the topicId and the generation runId to poll with ${TOPIC_INSIGHTS_STATUS_TOOL}. If the project has hit its weekly report limit or the topic's cooldown, the response has generated=false with a reason to relay to the user. To refresh an existing topic use ${TOPIC_INSIGHTS_REGENERATE_TOOL} instead. Requires a verified AI Visibility domain.`;

function registerCreateTopicInsightReportTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_CREATE_TOOL,                   /* Name */
    TOPIC_INSIGHTS_CREATE_DESCRIPTION(),          /* Description */
    CreateTopicInsightRequest,                    /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Create Topic Insight Report",
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ topicName, questions, projectId }) => {
      const requestBody = { topicName, questions };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_CREATE_URL, requestBody, callOptions);
    },
  );
}

// --- Regenerate Topic Insight Report ---

export const TOPIC_INSIGHTS_REGENERATE_TOOL = "regenerate-topic-insight-report";
export const TOPIC_INSIGHTS_REGENERATE_URL = mcpApiUrl("/topic-insights/regenerate");
export const TOPIC_INSIGHTS_REGENERATE_DESCRIPTION = () => `Regenerate the report for an existing Topic Insight topic (topicId and topicName required). Returns the new generation runId to poll with ${TOPIC_INSIGHTS_STATUS_TOOL}. If the topic is within its 7-day cooldown or the project hit its weekly limit, the response has generated=false with a reason to relay to the user. Requires a verified AI Visibility domain.`;

function registerRegenerateTopicInsightReportTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_REGENERATE_TOOL,               /* Name */
    TOPIC_INSIGHTS_REGENERATE_DESCRIPTION(),      /* Description */
    RegenerateTopicInsightRequest,                /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Regenerate Topic Insight Report",
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ topicId, topicName, projectId }) => {
      const requestBody = { topicId, topicName };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_REGENERATE_URL, requestBody, callOptions);
    },
  );
}

// --- Delete Topic Insight ---

export const TOPIC_INSIGHTS_DELETE_TOOL = "delete-topic-insight";
export const TOPIC_INSIGHTS_DELETE_URL = mcpApiUrl("/topic-insights/delete");
export const TOPIC_INSIGHTS_DELETE_DESCRIPTION = "Delete a Topic Insight topic and its reports (topicId required). This is destructive and cannot be undone - confirm with the user before calling. Requires a verified AI Visibility domain.";

function registerDeleteTopicInsightTool(server: McpServer): void {
  server.tool(
    TOPIC_INSIGHTS_DELETE_TOOL,                   /* Name */
    TOPIC_INSIGHTS_DELETE_DESCRIPTION,            /* Description */
    DeleteTopicInsightRequest,                    /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Delete Topic Insight",
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false
    },
    async ({ topicId, projectId }) => {
      const requestBody = { topicId };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(TOPIC_INSIGHTS_DELETE_URL, requestBody, callOptions);
    },
  );
}

// --- Registration ---

export function registerTopicInsightTools(server: McpServer): void {
  registerGetTopicInsightConstraintsTool(server);
  registerListTopicInsightsTool(server);
  registerGetTopicInsightReportTool(server);
  registerGetTopicInsightStatusTool(server);
  registerCreateTopicInsightReportTool(server);
  registerRegenerateTopicInsightReportTool(server);
  registerDeleteTopicInsightTool(server);
}
