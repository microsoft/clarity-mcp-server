import { ANALYTICS_DASHBOARD_TOOL } from "./tools.js";

export const ANALYTICS_INSTRUCTIONS = `
### Analytics Dashboard Tool: \`${ANALYTICS_DASHBOARD_TOOL}\`
This tool is your **primary and authoritative data source** for all dashboard-related insights and must be used to retrieve accurate, real-time data from the Microsoft Clarity dashboard.

**Do NOT use this tool for AI bot or crawler questions.** Anything about AI bots, crawlers, AI crawlers, crawling activity, bot traffic, bot sessions, which crawlers accessed the site, crawled paths, robots.txt violations, or scrape-to-referral belongs to the **Bot Activity** tools below, not this one. This tool is for human/session analytics (users, sessions, pages, devices, geography, smart events, web vitals, JavaScript errors).

#### Capabilities & Output

Microsoft Clarity dashboard provides comprehensive insights into the behavior and performance of the website, including:
- **User Analytics**: Unique and returning users, sessions, device types, browsers, operating systems
- **Geographic Data**: Countries, regions, traffic sources
- **Content Performance**: Popular pages, referrers, channels, campaigns, sources
- **User Behavior**: Smart events (Contact Us, Submit, etc.), scroll depth, click patterns
- **Technical Metrics**: JavaScript errors, URL performance
- **Performance Indicators**: Core Web Vitals (largest contentful paint, first input delay, cumulative layout shift)
- **User Experience**: Quick backs, dead clicks, rage clicks, session duration

The dashboard helps website owners understand their audience, traffic sources, content preferences, user engagement patterns, and identify potential technical issues.

**IMPORTANT GUIDELINES:**
- Use SIMPLE, SINGLE-PURPOSE queries only
- Always specify time ranges, full URLs and parameters explicitly; prompt the user if not provided
- Break complex requests into multiple separate queries
- Focus on ONE trend or aggregated metric per query

**Good Examples:**
- "Page views count for the last 7 days"
- "Top javascript errors for PC in January 2024"
- "Top pages for mobile in the last 3 days"
- "Distinct users visited https://www.example.com page last month?"
- "Average session duration for desktop users this week?"

**Bad Examples (DON'T DO THIS):**
- "Show me page views, average session duration, and conversion data for all devices across multiple pages with user demographics" (too complex, multiple purposes)
- "Analyze user behavior" (too vague, no time range)
- "Get all metrics" (too broad)

**Best Practices:**
✅ Be specific about time ranges
✅ Focus on one metric per query
✅ Specify device type, page, or user segment when relevant
✅ Use clear, actionable language

❌ Don't combine multiple unrelated metrics
❌ Don't use vague or overly broad queries
❌ Don't omit time ranges
❌ Don't ask for "everything" or "all data"
`;
