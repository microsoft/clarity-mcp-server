import {
  ANALYTICS_DASHBOARD_TOOL,
  DOCUMENTATION_TOOL,
  SESSION_RECORDINGS_TOOL
} from "./constants.js";

export const SYSTEM_INSTRUCTIONS_PROMPT = `
This MCP server provides access to Microsoft Clarity analytics dashboard data, documentation resources and session recordings.

## Available Tools

### 1. Session Recordings Tool: \`${SESSION_RECORDINGS_TOOL}\`
Lists Microsoft Clarity session recordings with metadata including session links, duration, and user interaction timelines.

**Parameters:**
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
- Get 10 newest sessions: { "count": 10, "sortBy": "SessionStart_DESC" }
- Get 20 longest sessions from date range: { "filters": { "date": { "start": "2024-01-01T00:00:00.000Z", "end": "2024-01-31T23:59:59.999Z" } }, "sortBy": "SessionDuration_DESC", "count": 20 }
- Get 15 mobile sessions with most clicks: { "filters": { "deviceType": ["Mobile"] }, "sortBy": "SessionClickCount_DESC", "count": 15 }
- Get oldest sessions first: { "sortBy": "SessionStart_ASC", "count": 100 }
- Get sessions with most page views: { "sortBy": "PageCount_DESC", "count": 100 }

### 2. Analytics Dashboard Tool: \`${ANALYTICS_DASHBOARD_TOOL}\`
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

### 3. Documentation Tool: \`${DOCUMENTATION_TOOL}\`

This tool is your **primary and authoritative data source** for all documentation-related questions and must be used to retrieve accurate, real-time data from the Microsoft Clarity documentation.

#### Capabilities & Output

Microsoft Clarity documentation provides comprehensive, authoritative answers to every aspect of Clarity including step-by-step screenshots for setup guides, features, usage, troubleshooting, and integration instructions. The tool covers all topics and headlines from the official documentation, including:

- **Getting Started & Installation**
	- About Clarity
	- Sign up for Clarity
	- Setup and install Clarity code
	- Verify your installation
	- Setup via third-party platforms (WordPress, Wix, Shopify, etc.)
	- Setup for Vibe Coding Platforms
	- Privacy disclosure wording
	- Data retention
	- Cookies and consent management (including Consent Mode)
	- troubleshooting installation

- **Clarity for Mobile Apps**
	- Android SDK
	- iOS SDK
	- React Native SDK
	- Flutter SDK
	- Cordova and Ionic SDK

- **Dashboard & Insights**
	- Insights overview
	- Dashboard features
	- E-commerce features
	- Blog features
	- Recipe features

- **Session Recordings**
	- What is a session recording?
	- Session list
	- Inline player
	- Live recordings
	- Visitor profile

- **Heatmaps**
	- What is a heatmap?
	- Heatmap features
	- Click maps
	- Scroll maps
	- Area maps

- **Filters & Segments**
	- Filters overview
	- Exclusion filters
	- Segments
	- Regular expressions

- **Settings & Management**
	- Account management
	- Team management
	- Masking
	- IP blocking
	- Funnels
	- Smart events

- **Copilot in Clarity**
	- Copilot overview
	- Copilot chat
	- Session insights
	- Grouped session insights
	- Heatmaps insights

- **Reference**
	- API Reference
	- Identify API
	- Export API
	- Custom tags
	- Troubleshooting (installation, settings, recordings, heatmaps, dashboard, live extension)
	- FAQ
	- Glossary of terms
	- Share Clarity
	- Download Clarity

- **Additional Links & Resources**
	- Blog
	- Case studies
	- Demo
	- Previous versions
	- Contribute
	- Privacy, Terms of Use, Trademarks

The documentation plugin ensures users answer frequently asked questions. for every headline and topic listed in the official Microsoft Clarity documentation, supporting all use cases, troubleshooting, integrations, and advanced features.
`;
