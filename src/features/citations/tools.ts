import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApiUrl } from "../../config.js";
import { callClarityApi, type CallOptions } from "../../mcp/client.js";
import {
  CitationItemTrendsRequest,
  CitationMetricTrendsRequest,
  CitationOverviewRequest,
  CitationPagesRequest,
  CitationQueriesRequest,
  CitationTopicsRequest
} from "./schemas.js";

// --- Get Citation Overview ---

export const CITATION_OVERVIEW_TOOL = "get-citation-overview";
export const CITATION_OVERVIEW_URL = mcpApiUrl("/citations/overview");
export const CITATION_OVERVIEW_DESCRIPTION = "Get an AI Visibility citations overview for the Clarity project, including citation counts, share of authority, branded and non-branded citation shares, AI referred traffic, topic availability, and data freshness. Supports date, query type, query, query topic, and cited-page filters.";

function registerGetCitationOverviewTool(server: McpServer): void {
  server.tool(
    CITATION_OVERVIEW_TOOL,                       /* Name */
    CITATION_OVERVIEW_DESCRIPTION,                /* Description */
    CitationOverviewRequest,                      /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Citation Overview",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, projectId }) => {
      const requestBody = { filters };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(CITATION_OVERVIEW_URL, requestBody, callOptions);
    },
  );
}

// --- List Citation Queries ---

export const CITATION_QUERIES_TOOL = "list-citation-queries";
export const CITATION_QUERIES_URL = mcpApiUrl("/citations/queries");
export const CITATION_QUERIES_DESCRIPTION = "List the AI queries that cite the Clarity project's verified domain, ranked by citation count. Returns query topic, citation count, share of authority, and branded status. Supports citation filters and pagination.";

function registerListCitationQueriesTool(server: McpServer): void {
  server.tool(
    CITATION_QUERIES_TOOL,                        /* Name */
    CITATION_QUERIES_DESCRIPTION,                 /* Description */
    CitationQueriesRequest,                       /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Citation Queries",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, skip, limit, projectId }) => {
      const requestBody = { filters, skip, limit };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(CITATION_QUERIES_URL, requestBody, callOptions);
    },
  );
}

// --- List Citation Topics ---

export const CITATION_TOPICS_TOOL = "list-citation-topics";
export const CITATION_TOPICS_URL = mcpApiUrl("/citations/topics");
export const CITATION_TOPICS_DESCRIPTION = "List AI query topics that cite the Clarity project's verified domain, ranked by citation count. Returns citation count and share of authority. Supports citation filters and pagination.";

function registerListCitationTopicsTool(server: McpServer): void {
  server.tool(
    CITATION_TOPICS_TOOL,                         /* Name */
    CITATION_TOPICS_DESCRIPTION,                  /* Description */
    CitationTopicsRequest,                        /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Citation Topics",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, skip, limit, projectId }) => {
      const requestBody = { filters, skip, limit };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(CITATION_TOPICS_URL, requestBody, callOptions);
    },
  );
}

// --- List Top Cited Pages ---

export const CITATION_PAGES_TOOL = "list-top-cited-pages";
export const CITATION_PAGES_URL = mcpApiUrl("/citations/pages");
export const CITATION_PAGES_DESCRIPTION = "List pages from the Clarity project's verified domain that were cited in AI answers, ranked by citation count. Supports citation filters and pagination.";

function registerListTopCitedPagesTool(server: McpServer): void {
  server.tool(
    CITATION_PAGES_TOOL,                          /* Name */
    CITATION_PAGES_DESCRIPTION,                   /* Description */
    CitationPagesRequest,                         /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Top Cited Pages",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, skip, limit, projectId }) => {
      const requestBody = { filters, skip, limit };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(CITATION_PAGES_URL, requestBody, callOptions);
    },
  );
}

// --- Get Citation Metric Trends ---

export const CITATION_METRIC_TRENDS_TOOL = "get-citation-metric-trends";
export const CITATION_METRIC_TRENDS_URL = mcpApiUrl("/citations/trends/metrics");
export const CITATION_METRIC_TRENDS_DESCRIPTION = "Get AI Visibility citation trends over time for whole-project metrics: total citations or share of authority. Returns one series of dated values. Does not take selected items.";

function registerGetCitationMetricTrendsTool(server: McpServer): void {
  server.tool(
    CITATION_METRIC_TRENDS_TOOL,                  /* Name */
    CITATION_METRIC_TRENDS_DESCRIPTION,           /* Description */
    CitationMetricTrendsRequest,                  /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Citation Metric Trends",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ dimension, filters, projectId }) => {
      const requestBody = { filters, dimension };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(CITATION_METRIC_TRENDS_URL, requestBody, callOptions);
    },
  );
}

// --- Get Citation Item Trends ---

export const CITATION_ITEM_TRENDS_TOOL = "get-citation-item-trends";
export const CITATION_ITEM_TRENDS_URL = mcpApiUrl("/citations/trends/items");
export const CITATION_ITEM_TRENDS_DESCRIPTION = () => `Get AI Visibility citation trends over time for specific queries or cited pages. Requires values containing exact values previously returned by ${CITATION_QUERIES_TOOL} or ${CITATION_PAGES_TOOL} for the matching dimension - do not invent values. Returns one dated series per selected item.`;

function registerGetCitationItemTrendsTool(server: McpServer): void {
  server.tool(
    CITATION_ITEM_TRENDS_TOOL,                    /* Name */
    CITATION_ITEM_TRENDS_DESCRIPTION(),           /* Description */
    CitationItemTrendsRequest,                    /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Citation Item Trends",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ dimension, values, filters, projectId }) => {
      const requestBody = { filters, dimension, values };
      const callOptions: CallOptions = { projectId };

      return await callClarityApi(CITATION_ITEM_TRENDS_URL, requestBody, callOptions);
    },
  );
}

// --- Registration ---

export function registerCitationTools(server: McpServer): void {
  registerGetCitationOverviewTool(server);
  registerListCitationQueriesTool(server);
  registerListCitationTopicsTool(server);
  registerListTopCitedPagesTool(server);
  registerGetCitationMetricTrendsTool(server);
  registerGetCitationItemTrendsTool(server);
}
