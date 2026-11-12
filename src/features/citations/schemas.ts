import { z } from "zod";
import { ProjectId } from "../../mcp/schemas.js";

// AI Visibility Citations
const MAX_CITATION_ROWS = 100;

const MAX_CITATION_TREND_VALUES = 5;

const CitationDateFilter = z.object({
  start: z.string().datetime().describe("Start of the citation data interval in UTC ISO 8601 format with milliseconds format (yyyy-MM-ddTHH:mm:ss.fffZ)."),
  end: z.string().datetime().describe("End of the citation data interval in UTC ISO 8601 format with milliseconds format (yyyy-MM-ddTHH:mm:ss.fffZ)."),
});

// Operators use the service's filter operator values as they are; StarstWith is the service's spelling of "starts with".
const CitationQueryFilter = z.object({
  operator: z.enum(["Equals", "Contains"]),
  value: z.string().min(1),
});

const CitationPageFilter = z.object({
  operator: z.enum(["Equals", "Contains", "StarstWith", "EndsWith", "RegexMatch"]).describe("The match operator to apply to the cited page URL. StarstWith matches the start of the URL."),
  value: z.string().min(1),
});

export const CitationFilters = z.object({
  date: CitationDateFilter.optional().describe("Citation data date range. Defaults to the last 7 days when omitted."),
  queryType: z.enum(["all", "branded", "nonbranded"]).default("all").describe("Filter citations by branded query type."),
  queries: z.array(CitationQueryFilter).optional().describe("Filter by exact or partially matching AI queries."),
  queryTopic: z.string().min(1).optional().describe("Filter by one exact query topic name."),
  citedPages: z.array(CitationPageFilter).optional().describe("Filter by cited page URLs using the selected match operator."),
});

export type CitationFiltersType = z.infer<typeof CitationFilters>;

const createCitationPagination = (defaultLimit: number) => ({
  skip: z.number().int().min(0).default(0).describe("Number of matching rows to skip."),
  limit: z.number().int().min(1).max(MAX_CITATION_ROWS).default(defaultLimit).describe(`Number of rows to return, at most ${MAX_CITATION_ROWS}.`),
});

export const CitationOverviewRequest = {
  filters: CitationFilters.optional(),
  projectId: ProjectId,
};

export const CitationQueriesRequest = {
  filters: CitationFilters.optional(),
  ...createCitationPagination(100),
  projectId: ProjectId,
};

export const CitationTopicsRequest = {
  filters: CitationFilters.optional(),
  ...createCitationPagination(10),
  projectId: ProjectId,
};

export const CitationPagesRequest = {
  filters: CitationFilters.optional(),
  ...createCitationPagination(100),
  projectId: ProjectId,
};

export const CitationMetricTrendsRequest = {
  filters: CitationFilters.optional(),
  dimension: z.enum(["citations", "shareOfAuthority"])
    .describe("Whole-project metric to trend over time."),
  projectId: ProjectId,
};

export const CitationItemTrendsRequest = {
  filters: CitationFilters.optional(),
  dimension: z.enum(["query", "page"])
    .describe("Item type to trend over time."),
  values: z.array(z.string().min(1)).min(1).max(MAX_CITATION_TREND_VALUES)
    .describe(`Up to ${MAX_CITATION_TREND_VALUES} exact values previously returned by list-citation-queries or list-top-cited-pages for the matching dimension - do not invent values.`),
  projectId: ProjectId,
};
