import {
  ANALYTICS_DASHBOARD_TOOL,
  DOCUMENTATION_TOOL,
  LIST_ACCOUNTS_TOOL,
  SESSION_RECORDINGS_TOOL
} from "./constants.js";

export const SYSTEM_INSTRUCTIONS_PROMPT = `
This MCP server provides access to Microsoft Clarity analytics dashboard data, documentation resources and session recordings.
It supports multiple Clarity projects/accounts — each identified by domain name.

## Multi-Account Usage

Use \`${LIST_ACCOUNTS_TOOL}\` to see all configured projects.
Pass the \`account\` parameter (domain name) to any data tool to specify which project to query.
If only one account is configured, or a default is set, it will be used automatically.

## Available Tools

### 1. List Accounts Tool: \`${LIST_ACCOUNTS_TOOL}\`
Lists all configured Clarity accounts/projects. Use this first to discover available domains.

### 2. Session Recordings Tool: \`${SESSION_RECORDINGS_TOOL}\`
Lists Microsoft Clarity session recordings with metadata including session links, duration, and user interaction timelines.

**Parameters:**
- account: Domain name of the Clarity project (e.g., "crowntrophy.com")
- filters: Optional filters for sessions (date range, device type, etc.)
- sortBy: Sort option using SortOptions enum (default: SessionStart_DESC)
- count: Number of sessions to retrieve (1-250, default: 100)

**Sort Options:**
- SessionStart_DESC (newest first - default)
- SessionStart_ASC (oldest first)
- SessionDuration_ASC (shortest duration first)
- SessionDuration_DESC (longest duration first)
- SessionClickCount_ASC (fewest clicks first)
- SessionClickCount_DESC (most clicks first)
- PageCount_ASC (fewest pages first)
- PageCount_DESC (most pages first)

**Example Usage:**
- Get 10 newest sessions: { "account": "example.com", "count": 10, "sortBy": "SessionStart_DESC" }
- Get 20 longest sessions from date range: { "account": "example.com", "filters": { "date": { "start": "2024-01-01T00:00:00.000Z", "end": "2024-01-31T23:59:59.999Z" } }, "sortBy": "SessionDuration_DESC", "count": 20 }

### 3. Analytics Dashboard Tool: \`${ANALYTICS_DASHBOARD_TOOL}\`
This tool is your **primary and authoritative data source** for all dashboard-related insights and must be used to retrieve accurate, real-time data from the Microsoft Clarity dashboard.

#### Capabilities & Output

Microsoft Clarity dashboard provides comprehensive insights into the behavior and performance of the website, including:
- **User Analytics**: Unique and returning users, sessions, device types, browsers, operating systems
- **Geographic Data**: Countries, regions, traffic sources
- **Content Performance**: Popular pages, referrers, channels, campaigns, sources
- **User Behavior**: Smart events (Contact Us, Submit, etc.), scroll depth, click patterns
- **Technical Metrics**: JavaScript errors, URL performance
- **Performance Indicators**: Core Web Vitals (largest contentful paint, first input delay, cumulative layout shift)
- **User Experience**: Quick backs, dead clicks, rage clicks, session duration

**IMPORTANT GUIDELINES:**
- Use SIMPLE, SINGLE-PURPOSE queries only
- Always specify time ranges, full URLs and parameters explicitly; prompt the user if not provided
- Always include the \`account\` parameter to specify which site to query
- Break complex requests into multiple separate queries
- Focus on ONE trend or aggregated metric per query

**Good Examples:**
- "Page views count for the last 7 days" (with account: "mysite.com")
- "Top javascript errors for PC in January 2024"
- "Top pages for mobile in the last 3 days"

**Bad Examples (DON'T DO THIS):**
- "Show me page views, average session duration, and conversion data for all devices across multiple pages" (too complex)
- "Analyze user behavior" (too vague, no time range)

### 4. Documentation Tool: \`${DOCUMENTATION_TOOL}\`

This tool is your **primary and authoritative data source** for all documentation-related questions and must be used to retrieve accurate, real-time data from the Microsoft Clarity documentation.
Documentation queries do not require an account parameter — they are global.

#### Capabilities & Output

Microsoft Clarity documentation provides comprehensive, authoritative answers to every aspect of Clarity including step-by-step screenshots for setup guides, features, usage, troubleshooting, and integration instructions.
`;
