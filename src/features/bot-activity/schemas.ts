import { z } from "zod";
import { ProjectId } from "../../mcp/schemas.js";

// AI Visibility Bot Activity
const MAX_BOT_ACTIVITY_ROWS = 100;

const MAX_BOT_ACTIVITY_TREND_VALUES = 5;

enum BotActivityBotType {
  AIBots = "AIBots",
  AllBots = "AllBots",
  AllTraffic = "AllTraffic",
}

enum BotActivityColumn {
  BotOperator = "BotOperator",
  BotAgent = "BotAgent",
  BotCategory = "BotCategory",
}

enum BotActivityDistributionDimension {
  ContentType = "contentType",
  PageType = "pageType",
  StatusCode = "statusCode",
}

enum BotActivityMetricTrendDimension {
  TotalRequests = "totalRequests",
  SitePagesCrawled = "sitePagesCrawled",
  Violations = "violations",
}

enum BotActivityItemTrendDimension {
  Path = "path",
  StatusCode = "statusCode",
  ContentType = "contentType",
}

// Mirrors the service's ContentType enum.
enum BotActivityContentType {
  Image = "Image",
  Audio = "Audio",
  Video = "Video",
  HTML = "HTML",
  JSON = "JSON",
  XML = "XML",
  PDF = "PDF",
  Unknown = "Unknown",
  JavaScript = "JavaScript",
  CSS = "CSS",
  Markdown = "Markdown",
  Text = "Text",
  Font = "Font",
}

// Mirrors the filterable providers in the service's CdnProvider enum.
enum BotActivityCdnProvider {
  Azure = "Azure",
  Akamai = "Akamai",
  Fastly = "Fastly",
  Cloudflare = "Cloudflare",
  WordPress = "WordPress",
  CloudFront = "CloudFront",
}

const BotActivityDateFilter = z.object({
  start: z.string().datetime({ offset: true, local: true }).describe("Start of the Bot Activity interval. Prefer local wall-clock with no timezone (e.g. 2026-08-24T00:00:00) - it is interpreted in the user's local timezone to match the dashboard. Append Z only for an explicit UTC instant."),
  end: z.string().datetime({ offset: true, local: true }).describe("End of the Bot Activity interval. Prefer local wall-clock with no timezone (e.g. 2026-08-24T23:59:59), interpreted in the user's local timezone. Append Z only for an explicit UTC instant."),
});

// Operators use the service's filter operator values as they are; StarstWith is the service's spelling of "starts with".
const BotActivityPathFilter = z.object({
  operator: z.enum(["Equals", "Contains", "StarstWith", "EndsWith", "RegexMatch"]).describe("The match operator to apply to the path value. StarstWith matches the start of the path."),
  value: z.string().min(1),
});

export const BotActivityFilters = z.object({
  date: BotActivityDateFilter.optional().describe("Bot Activity date range. Defaults to the last 7 days in your local timezone when omitted, matching the dashboard."),
  botType: z.nativeEnum(BotActivityBotType).default(BotActivityBotType.AIBots).describe("Which traffic to scope to. AIBots covers AI crawlers only, AllBots covers every known bot, AllTraffic covers bots and humans."),
  botOperator: z.array(z.string().min(1)).optional().describe("Filter by bot operator names (e.g., ['OpenAI', 'Anthropic']). Multiple values are OR-ed."),
  botAgent: z.array(z.string().min(1)).optional().describe("Filter by bot user agent names (e.g., ['GPTBot', 'ClaudeBot']). Multiple values are OR-ed."),
  botActivity: z.array(z.string().min(1)).optional().describe("Filter by bot category (e.g., ['AI Crawler', 'AI Assistant', 'AI Search'] for AI bots). Multiple values are OR-ed."),
  violation: z.enum(["Violation", "NoViolation"]).optional().describe("Filter to requests that did or did not violate robots.txt."),
  cdnProvider: z.nativeEnum(BotActivityCdnProvider).optional().describe("Filter to logs from one connected CDN provider. Omit to use the project's default provider, which is what the dashboard shows."),
  statusCode: z.array(z.string().min(1)).optional().describe("Filter by HTTP response status codes (e.g., ['200', '404']). Multiple values are OR-ed."),
  domain: z.array(z.string().min(1)).optional().describe("Filter by the customer domain that was crawled. Multiple values are OR-ed. Omit to use the dashboard default, which covers the domains present in both the CDN logs and the Clarity tag."),
  path: z.array(BotActivityPathFilter).optional().describe("Filter by crawled path using the selected match operator. Multiple entries are OR-ed."),
  contentType: z.array(z.nativeEnum(BotActivityContentType)).optional().describe("Filter by response content type. Multiple values are OR-ed."),
  pageType: z.array(z.string().min(1)).optional().describe("Filter by inferred page type (e.g., ['Product', 'Blog']). Multiple values are OR-ed."),
});

export type BotActivityFiltersType = z.infer<typeof BotActivityFilters>;

const BotActivityRequest = {
  filters: BotActivityFilters.optional(),
  projectId: ProjectId,
};

const createBotActivityPagination = () => ({
  skip: z.number().int().min(0).default(0).describe("Number of matching rows to skip."),
  limit: z.number().int().min(1).max(MAX_BOT_ACTIVITY_ROWS).default(MAX_BOT_ACTIVITY_ROWS).describe(`Number of rows to return, at most ${MAX_BOT_ACTIVITY_ROWS}.`),
});

export const BotActivityOverviewRequest = BotActivityRequest;

export const BotActivityCrawlersRequest = {
  ...BotActivityRequest,
  labelColumn: z.nativeEnum(BotActivityColumn).describe("Column used to group crawlers into top-level rows."),
  itemColumn: z.nativeEnum(BotActivityColumn).describe("Column used to break each top-level row into nested items."),
  ...createBotActivityPagination(),
  isSortAscending: z.boolean().optional().describe("Sort ascending by request count instead of descending."),
};

export const BotActivityPathsRequest = {
  ...BotActivityRequest,
  ...createBotActivityPagination(),
  isAscending: z.boolean().optional().describe("Sort ascending by request count instead of descending."),
  groupByContentType: z.boolean().optional().describe("Group the returned paths by response content type."),
};

export const BotActivityDistributionRequest = {
  ...BotActivityRequest,
  dimension: z.nativeEnum(BotActivityDistributionDimension).describe("Dimension to break the bot requests down by."),
};

export const BotActivityMetricTrendsRequest = {
  ...BotActivityRequest,
  dimension: z.nativeEnum(BotActivityMetricTrendDimension).describe("Whole-project metric to trend over time."),
};

export const BotActivityItemTrendsRequest = {
  ...BotActivityRequest,
  dimension: z.nativeEnum(BotActivityItemTrendDimension).describe("Item type to trend over time."),
  values: z.array(z.string().min(1)).min(1).max(MAX_BOT_ACTIVITY_TREND_VALUES)
    .describe(`Up to ${MAX_BOT_ACTIVITY_TREND_VALUES} exact values previously returned for the matching dimension - do not invent values. For path, use the full url field (not the path field) returned by list-bot-path-requests; for statusCode or contentType, use the values returned by get-bot-activity-distribution.`),
};

const CrawlerTrendValue = z.object({
  label: z.string().min(1).describe("Exact labelColumn value previously returned by list-ai-crawlers."),
  item: z.string().min(1).optional().describe("Exact itemColumn value nested under that label. Omit to trend the label total."),
});

export const BotActivityCrawlerTrendsRequest = {
  ...BotActivityRequest,
  labelColumn: z.nativeEnum(BotActivityColumn).describe("Must match the labelColumn used in the list-ai-crawlers call the values came from."),
  itemColumn: z.nativeEnum(BotActivityColumn).describe("Must match the itemColumn used in the list-ai-crawlers call the values came from."),
  values: z.array(CrawlerTrendValue).min(1).max(MAX_BOT_ACTIVITY_TREND_VALUES)
    .describe(`Up to ${MAX_BOT_ACTIVITY_TREND_VALUES} crawler selections previously returned by list-ai-crawlers - do not invent values.`),
};

const BotActivityFiltersWithRequiredDate = BotActivityFilters.extend({
  date: BotActivityDateFilter.describe("Required Bot Activity date range for the scrape-to-referral ratio."),
});

export type BotActivityScrapeToReferralFiltersType = z.infer<typeof BotActivityFiltersWithRequiredDate>;

export const BotActivityScrapeToReferralRequest = {
  filters: BotActivityFiltersWithRequiredDate,
  projectId: ProjectId,
};

export const BotActivityCdnProvidersRequest = BotActivityRequest;
