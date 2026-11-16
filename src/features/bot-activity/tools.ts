import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpApiUrl } from "../../config.js";
import { callClarityApi, type CallOptions } from "../../mcp/client.js";
import type { ToolResult } from "../../mcp/results.js";
import {
  BotActivityCdnProvidersRequest,
  BotActivityCrawlersRequest,
  BotActivityCrawlerTrendsRequest,
  BotActivityDistributionRequest,
  BotActivityItemTrendsRequest,
  BotActivityMetricTrendsRequest,
  BotActivityOverviewRequest,
  BotActivityPathsRequest,
  BotActivityScrapeToReferralRequest
} from "./schemas.js";

// --- Shared helpers ---

const queryBotActivityEndpointAsync = async (
  url: string,
  body: Record<string, unknown>,
  projectId?: string,
): Promise<ToolResult> => {
  // The host timezone lets the server snap default date ranges and bucket trends like the dashboard.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const requestBody = { timeZone, ...body };
  const callOptions: CallOptions = { projectId };

  return await callClarityApi(url, requestBody, callOptions);
};

// --- Get Bot Activity Overview ---

export const BOT_ACTIVITY_OVERVIEW_TOOL = "get-bot-activity-overview";
export const BOT_ACTIVITY_OVERVIEW_URL = mcpApiUrl("/bot-activity/overview");
export const BOT_ACTIVITY_OVERVIEW_DESCRIPTION = "Get Bot Activity (also called Crawling Activity or AI crawler activity) summary metrics for the Clarity project. Use this and the other Bot Activity tools - not the analytics dashboard tool - for any question about AI bots, crawlers, crawling activity, or bot traffic. Returns raw counts plus the percentages shown on the dashboard cards: shareOfTotalTrafficPercent (scoped vs all-traffic requests), uniqueHtmlPathsSharePercent (scoped vs all-traffic unique HTML paths), and violationsSharePercent (robots.txt violations vs scoped requests). Also returns selectedCdnProvider and cdnProviders with their connection status and last data timestamps. Does not require a verified AI Visibility domain. Unless overridden, results are scoped to the selected default CDN provider and to the domains covered by both the CDN logs and the Clarity tag.";

function registerGetBotActivityOverviewTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_OVERVIEW_TOOL,                   /* Name */
    BOT_ACTIVITY_OVERVIEW_DESCRIPTION,            /* Description */
    BotActivityOverviewRequest,                   /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Bot Activity Overview",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_OVERVIEW_URL, { filters }, projectId);
    },
  );
}

// --- List AI Crawlers ---

export const BOT_ACTIVITY_CRAWLERS_TOOL = "list-ai-crawlers";
export const BOT_ACTIVITY_CRAWLERS_URL = mcpApiUrl("/bot-activity/crawlers");
export const BOT_ACTIVITY_CRAWLERS_DESCRIPTION = "List AI crawlers and their request counts for the Clarity project. Supports Bot Activity filters plus labelColumn and itemColumn grouping.";

function registerListAiCrawlersTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_CRAWLERS_TOOL,                   /* Name */
    BOT_ACTIVITY_CRAWLERS_DESCRIPTION,            /* Description */
    BotActivityCrawlersRequest,                   /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List AI Crawlers",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, labelColumn, itemColumn, skip, limit, isSortAscending, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_CRAWLERS_URL, {
        filters,
        labelColumn,
        itemColumn,
        skip,
        limit,
        isSortAscending,
      }, projectId);
    },
  );
}

// --- List Bot Activity Paths ---

export const BOT_ACTIVITY_PATHS_TOOL = "list-bot-path-requests";
export const BOT_ACTIVITY_PATHS_URL = mcpApiUrl("/bot-activity/paths");
export const BOT_ACTIVITY_PATHS_DESCRIPTION = "List the paths requested by AI bots for the Clarity project, ranked by request count. Each row includes count and its percent share. Supports Bot Activity filters, pagination, sorting, and optional content-type grouping.";

function registerListBotPathRequestsTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_PATHS_TOOL,                      /* Name */
    BOT_ACTIVITY_PATHS_DESCRIPTION,               /* Description */
    BotActivityPathsRequest,                      /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Bot Activity Paths",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, skip, limit, isAscending, groupByContentType, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_PATHS_URL, {
        filters,
        skip,
        limit,
        isAscending,
        groupByContentType,
      }, projectId);
    },
  );
}

// --- Get Bot Activity Distribution ---

export const BOT_ACTIVITY_DISTRIBUTION_TOOL = "get-bot-activity-distribution";
export const BOT_ACTIVITY_DISTRIBUTION_URL = mcpApiUrl("/bot-activity/distribution");
export const BOT_ACTIVITY_DISTRIBUTION_DESCRIPTION = "Get a Bot Activity distribution for one dimension: content type, page type, or HTTP status code. Each entry includes count and its percent share of the distribution total. Supports all Bot Activity filters.";

function registerGetBotActivityDistributionTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_DISTRIBUTION_TOOL,               /* Name */
    BOT_ACTIVITY_DISTRIBUTION_DESCRIPTION,        /* Description */
    BotActivityDistributionRequest,               /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Bot Activity Distribution",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, dimension, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_DISTRIBUTION_URL, { filters, dimension }, projectId);
    },
  );
}

// --- Get Bot Activity Metric Trends ---

export const BOT_ACTIVITY_METRIC_TRENDS_TOOL = "get-bot-activity-metric-trends";
export const BOT_ACTIVITY_METRIC_TRENDS_URL = mcpApiUrl("/bot-activity/trends/metrics");
export const BOT_ACTIVITY_METRIC_TRENDS_DESCRIPTION = "Get Bot Activity trends over time for whole-project metrics: total AI requests, unique site pages crawled, or robots.txt violations. Returns one dated series where value is the filtered metric, totalValue is the comparable unfiltered total, and percent is value as a share of totalValue. Does not take selected items. The bucket size follows the date range, as in the dashboard.";

function registerGetBotActivityMetricTrendsTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_METRIC_TRENDS_TOOL,              /* Name */
    BOT_ACTIVITY_METRIC_TRENDS_DESCRIPTION,       /* Description */
    BotActivityMetricTrendsRequest,               /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Bot Activity Metric Trends",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, dimension, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_METRIC_TRENDS_URL, { filters, dimension }, projectId);
    },
  );
}

// --- Get Bot Activity Item Trends ---

export const BOT_ACTIVITY_ITEM_TRENDS_TOOL = "get-bot-activity-item-trends";
export const BOT_ACTIVITY_ITEM_TRENDS_URL = mcpApiUrl("/bot-activity/trends/items");
export const BOT_ACTIVITY_ITEM_TRENDS_DESCRIPTION = () => `Get Bot Activity trends over time for specific crawled paths, HTTP status codes, or content types. Requires values containing exact values previously returned by ${BOT_ACTIVITY_PATHS_TOOL} (its full url field for paths) or ${BOT_ACTIVITY_DISTRIBUTION_TOOL} for the matching dimension - do not invent values. Returns one dated series per selected item.`;

function registerGetBotActivityItemTrendsTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_ITEM_TRENDS_TOOL,                /* Name */
    BOT_ACTIVITY_ITEM_TRENDS_DESCRIPTION(),       /* Description */
    BotActivityItemTrendsRequest,                 /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Bot Activity Item Trends",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, dimension, values, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_ITEM_TRENDS_URL, { filters, dimension, values }, projectId);
    },
  );
}

// --- Get AI Crawler Trends ---

export const BOT_ACTIVITY_CRAWLER_TRENDS_TOOL = "get-ai-crawler-trends";
export const BOT_ACTIVITY_CRAWLER_TRENDS_URL = mcpApiUrl("/bot-activity/trends/crawlers");
export const BOT_ACTIVITY_CRAWLER_TRENDS_DESCRIPTION = () => `Get Bot Activity trends over time for specific AI crawlers. Requires values containing exact label and item values previously returned by ${BOT_ACTIVITY_CRAWLERS_TOOL}, using the same labelColumn and itemColumn - do not invent values. Returns one dated series per selected crawler.`;

function registerGetAiCrawlerTrendsTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_CRAWLER_TRENDS_TOOL,             /* Name */
    BOT_ACTIVITY_CRAWLER_TRENDS_DESCRIPTION(),    /* Description */
    BotActivityCrawlerTrendsRequest,              /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get AI Crawler Trends",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, labelColumn, itemColumn, values, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_CRAWLER_TRENDS_URL, {
        filters,
        labelColumn,
        itemColumn,
        values,
      }, projectId);
    },
  );
}

// --- Get Scrape To Referral Ratio ---

export const BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL = "get-scrape-to-referral-ratio";
export const BOT_ACTIVITY_SCRAPE_TO_REFERRAL_URL = mcpApiUrl("/bot-activity/scrape-to-referral");
export const BOT_ACTIVITY_SCRAPE_TO_REFERRAL_DESCRIPTION = "Get the scrape-to-referral ratio for the Clarity project: how many AI scrapes each operator performed for every visit it referred back. Returns per-provider ratios, referrer breakdowns, the domains covered by CDN logs and by the Clarity tag, and a coverage state explaining any gap. Requires a date filter.";

function registerGetScrapeToReferralRatioTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL,         /* Name */
    BOT_ACTIVITY_SCRAPE_TO_REFERRAL_DESCRIPTION,  /* Description */
    BotActivityScrapeToReferralRequest,           /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "Get Scrape To Referral Ratio",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_SCRAPE_TO_REFERRAL_URL, { filters }, projectId);
    },
  );
}

// --- List Connected CDN Providers ---

export const BOT_ACTIVITY_CDN_PROVIDERS_TOOL = "list-connected-cdn-providers";
export const BOT_ACTIVITY_CDN_PROVIDERS_URL = mcpApiUrl("/bot-activity/cdn-providers");
export const BOT_ACTIVITY_CDN_PROVIDERS_DESCRIPTION = "List the CDN providers connected to the Clarity project, with each provider's connection status and the domain its bot logs cover. Use this to explain missing Bot Activity data before analyzing crawl coverage.";

function registerListConnectedCdnProvidersTool(server: McpServer): void {
  server.tool(
    BOT_ACTIVITY_CDN_PROVIDERS_TOOL,              /* Name */
    BOT_ACTIVITY_CDN_PROVIDERS_DESCRIPTION,       /* Description */
    BotActivityCdnProvidersRequest,               /* Parameter Schema */
    {                                             /* Metadata & Annotations */
      title: "List Connected CDN Providers",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, projectId }) => {
      return await queryBotActivityEndpointAsync(BOT_ACTIVITY_CDN_PROVIDERS_URL, { filters }, projectId);
    },
  );
}

// --- Registration ---

export function registerBotActivityTools(server: McpServer): void {
  registerGetBotActivityOverviewTool(server);
  registerListAiCrawlersTool(server);
  registerListBotPathRequestsTool(server);
  registerGetBotActivityDistributionTool(server);
  registerGetBotActivityMetricTrendsTool(server);
  registerGetBotActivityItemTrendsTool(server);
  registerGetAiCrawlerTrendsTool(server);
  registerGetScrapeToReferralRatioTool(server);
  registerListConnectedCdnProvidersTool(server);
}
