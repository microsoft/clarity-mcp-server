import { ANALYTICS_DASHBOARD_TOOL } from "../analytics/tools.js";
import {
  BOT_ACTIVITY_CDN_PROVIDERS_TOOL,
  BOT_ACTIVITY_CRAWLER_TRENDS_TOOL,
  BOT_ACTIVITY_CRAWLERS_TOOL,
  BOT_ACTIVITY_DISTRIBUTION_TOOL,
  BOT_ACTIVITY_ITEM_TRENDS_TOOL,
  BOT_ACTIVITY_METRIC_TRENDS_TOOL,
  BOT_ACTIVITY_OVERVIEW_TOOL,
  BOT_ACTIVITY_PATHS_TOOL,
  BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL,
} from "./tools.js";

export const BOT_ACTIVITY_INSTRUCTIONS = `
#### Bot Activity

Bot Activity - also called **Crawling Activity**, **AI crawlers**, or **crawler activity** in the dashboard - helps users understand how identified AI bots access their website: which crawlers arrive, which paths they request, what content and page types they retrieve, and which HTTP status codes they receive. Unlike citations, Bot Activity does not require a verified AI Visibility domain - its data arrives from a connected CDN, and it can cover several domains at once. Use these tools - not \`${ANALYTICS_DASHBOARD_TOOL}\` - for any question about AI bots, crawlers, crawling activity, bot traffic, bot sessions, robots.txt violations, or scrape-to-referral. All Bot Activity tools accept the same date, bot type, bot operator, bot agent, bot activity, robots.txt violation, CDN provider, domain, path, content type, page type, and status-code filters.

- \`${BOT_ACTIVITY_OVERVIEW_TOOL}\`: Summary of scoped AI requests, unique HTML paths, and robots.txt compliance violations. Scoped metrics use all supplied filters.
- \`${BOT_ACTIVITY_CRAWLERS_TOOL}\`: AI crawlers grouped by the requested label and item columns.
- \`${BOT_ACTIVITY_PATHS_TOOL}\`: Ranked paths requested by AI bots, with optional pagination and content-type grouping.
- \`${BOT_ACTIVITY_DISTRIBUTION_TOOL}\`: Distribution by content type, page type, or HTTP status code.
- \`${BOT_ACTIVITY_METRIC_TRENDS_TOOL}\`: Trends for whole-project metrics - total requests, site pages crawled, or robots.txt violations.
- \`${BOT_ACTIVITY_ITEM_TRENDS_TOOL}\`: Trends for specific paths, status codes, or content types.
- \`${BOT_ACTIVITY_CRAWLER_TRENDS_TOOL}\`: Trends for specific AI crawlers.
- \`${BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL}\`: How many AI scrapes each operator performed for every visit it referred back, plus the CDN and Clarity domain coverage behind that ratio.
- \`${BOT_ACTIVITY_CDN_PROVIDERS_TOOL}\`: CDN providers connected to the project, with connection status and covered domain.

Bot Activity data arrives through a connected CDN and can span several domains. Two scopes are applied automatically so results match the dashboard, and any value you pass explicitly overrides them:

- **CDN provider** - a provider is always selected for you: the first connected one, or - when every provider is disconnected - the first provider so its retained historical logs still show. Results are only empty when no CDN is integrated at all; call \`${BOT_ACTIVITY_CDN_PROVIDERS_TOOL}\` before concluding the site has no bot traffic.
- **Domains** - results are scoped to the domains covered by both the CDN logs and the Clarity tag, unless the project only has one domain. Pass \`domain\` explicitly to widen or narrow this, and use \`${BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL}\` to see which domains fall into each group.

Every \`${BOT_ACTIVITY_OVERVIEW_TOOL}\` response includes \`selectedCdnProvider\` and \`cdnProviders\`. State that the overview is scoped to \`selectedCdnProvider\` when reporting its metrics, and tell the user they can request another connected provider by passing \`filters.cdnProvider\`. When a provider has \`disconnected: true\`, use its \`lastFetchedAt\` and \`updatedAt\` values to tell the user that its results may be historical or stale; do not imply that an empty or old result means no bot traffic.

**Timezone.** The user's local timezone is detected and forwarded automatically - never ask for it, and always reason about time in the user's local timezone rather than UTC. Interpret every relative timeframe the user mentions (today, yesterday, this week, last 7 days, last month, this quarter) in that local timezone. For a recent-window question, omit the date filter except for \`${BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL}\`, which requires explicit date bounds: the other tools then apply the last-7-days window at the user's local-timezone day boundaries, exactly like the dashboard - do not hand-build UTC dates for it. When you do supply an explicit date range, write the bounds as the user's local wall-clock with no trailing Z (for example a full day as 2026-08-24T00:00:00 to 2026-08-24T23:59:59); the server interprets them in the user's local timezone so results match the dashboard. Append Z only when the user explicitly asks for a UTC range.

The trend tools follow the same rule as citations: \`${BOT_ACTIVITY_ITEM_TRENDS_TOOL}\` requires values copied exactly from a prior \`${BOT_ACTIVITY_PATHS_TOOL}\` (use each row's full \`url\`, not its \`path\`) or \`${BOT_ACTIVITY_DISTRIBUTION_TOOL}\` call, and \`${BOT_ACTIVITY_CRAWLER_TRENDS_TOOL}\` requires label and item values copied exactly from a prior \`${BOT_ACTIVITY_CRAWLERS_TOOL}\` call using the same labelColumn and itemColumn - never invent or guess a value. If you do not already have candidate values, call the matching list tool first. \`${BOT_ACTIVITY_METRIC_TRENDS_TOOL}\` takes no item selection and returns both the filtered value and the comparable unfiltered total per bucket. All trend tools bucket by the date filter, so widen or narrow the range rather than asking for a bucket size.

\`${BOT_ACTIVITY_SCRAPE_TO_REFERRAL_TOOL}\` requires a date filter and returns a coverage state explaining any gap between CDN-observed domains and Clarity-tagged domains. Report that coverage state rather than treating a missing ratio as zero referrals.
`;
