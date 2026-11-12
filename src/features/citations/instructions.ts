import {
  CITATION_ITEM_TRENDS_TOOL,
  CITATION_METRIC_TRENDS_TOOL,
  CITATION_OVERVIEW_TOOL,
  CITATION_PAGES_TOOL,
  CITATION_QUERIES_TOOL,
  CITATION_TOPICS_TOOL,
} from "./tools.js";

export const CITATION_INSTRUCTIONS = `
#### Citations

Citations require the project's AI Visibility domain to be verified. If a tool reports that the domain is not verified, relay that to the user; do not retry. Use these tools to understand which AI queries and answers cite the project's domain:

- \`${CITATION_OVERVIEW_TOOL}\`: Citation counts, share of authority, branded/non-branded split, AI referred traffic, topic availability, and data freshness.
- \`${CITATION_QUERIES_TOOL}\`: Ranked AI queries that cite the project's domain.
- \`${CITATION_TOPICS_TOOL}\`: Ranked AI query topics that cite the project's domain.
- \`${CITATION_PAGES_TOOL}\`: Ranked pages from the project's domain cited in AI answers.
- \`${CITATION_METRIC_TRENDS_TOOL}\`: Trends for whole-project metrics - total citations or share of authority.
- \`${CITATION_ITEM_TRENDS_TOOL}\`: Trends for specific queries or cited pages.

All citation tools support date, branded/non-branded, query, query-topic, and cited-page filters, and cover the last 7 days when no date filter is given. \`${CITATION_ITEM_TRENDS_TOOL}\` requires values containing exact values copied from a prior call to \`${CITATION_QUERIES_TOOL}\` or \`${CITATION_PAGES_TOOL}\` respectively - never invent or guess a value. If you do not already have candidate values, call the matching list tool first.
`;
