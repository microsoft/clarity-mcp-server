# Microsoft Clarity MCP Server

This Model Context Protocol (MCP) server connects Microsoft Clarity to Visual Studio Code, Claude Desktop, and other MCP-compatible clients.
Use natural language to explore analytics, session recordings, AI Visibility insights, and Clarity documentation.

## Key Features

- **Analytics Data Access**: Query your Microsoft Clarity analytics data including traffic metrics, user behavior insights, and performance statistics
- **Session Recording Retrieval**: Access and analyze session recordings to understand user interactions and identify optimization opportunities
- **AI Visibility Citations**: Query citation overview metrics, top queries, query topics, cited pages, and trends for your verified domain
- **AI Visibility Bot Activity**: Query AI crawler activity, requested paths, content and status-code distributions, trends, scrape-to-referral ratios, and connected CDN providers
- **AI Visibility Topic Insights**: Review topic simulation reports, citation rate, competitive share, and content strengths and opportunities for your verified domain
- **Natural Language Querying**: Ask questions in plain English to get insights from your data - no need to learn complex query syntax or API endpoints
- **Flexible Data Filtering**: Filter results by various dimensions such as browser, device, country, and many more
- **Real-Time Data Access**: Fetch the latest analytics data and insights from your Clarity projects on-demand
- **Documentation Integration**: Get quick answers and guidance from Microsoft Clarity documentation directly within your workflow
- **Seamless MCP Integration**: Works natively with Claude for Desktop, Visual Studio Code, and other Model Context Protocol (MCP) compatible clients

## Setup and Installation

### Prerequisites

- Node.js v16 or higher
- A Microsoft Clarity account with admin or member access to at least one project
- An MCP-compatible client, such as Visual Studio Code or Claude Desktop

### Installation

#### Option 1: Run with npx (recommended)

Configure your MCP client to start the latest package with `npx`:

```json
{
  "mcpServers": {
    "microsoft-clarity": {
      "command": "npx",
      "args": ["-y", "@microsoft/clarity-mcp-server"]
    }
  }
}
```

#### Option 2: Install globally

```bash
npm install -g @microsoft/clarity-mcp-server
clarity-mcp-server
```

#### Option 3: Manual Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```
4. Run the server:
   ```bash
   npm run start
   ```

### Extension/Plugin Installation

#### Visual Studio Code Extension

[<img src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install+Server&color=0098FF" alt="Install in VS Code">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522clarity-server%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540microsoft%252Fclarity-mcp-server%2522%255D%257D)

Click the button above to install the Microsoft Clarity MCP server directly in Visual Studio Code.

#### Claude Desktop Plugin

Install from Claude's extension gallery:

1. Open **Claude Desktop**
2. Navigate to **File → Settings → Customize**
3. Under **Connectors**, search for **Microsoft Clarity**
4. Click **Install** to add the extension

### Quick Start

After the server starts:

1. Ask your MCP client to **sign in to Microsoft Clarity**.
2. The server opens the Microsoft Clarity sign-in page in your browser. If it cannot open the browser, it returns a link for you to open.
3. Complete sign-in in the browser, then return to your MCP client.
4. The client automatically checks sign-in status without asking you to confirm completion. The server receives the authorization code and exchanges tokens on the browser callback; the client reports any sign-in error or shows the projects your account can access.
5. Select a default project if you can access more than one, then start asking questions about your Clarity data.

Try these prompts:

- How many Clarity sessions did we get in the past 7 days?
- List the most recent Clarity sessions from mobile devices.
- How do I track custom events using Microsoft Clarity?

## Configuring MCP Clients

### Generic MCP Client Configuration

MCP clients typically require configuration to connect to the server. Here's a general example of how to configure an MCP client:

```json
{
  "mcpServers": {
    "@microsoft/clarity-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "@microsoft/clarity-mcp-server"
      ]
    }
  }
}
```

The specifics of where and how to add this configuration will depend on your specific MCP client.

### Claude for Desktop Configuration

To configure Claude for Desktop to use this server:

1. Open your Claude for Desktop configuration file:
   - **Windows**: `%AppData%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the token-free configuration shown in the generic example above
3. Save the configuration file and restart Claude for Desktop

## Server Usage

The server exposes various tools that you can call from any MCP client.
Just ask naturally and keep each request focused on one thing.

### Analytics Dashboard
- <b>Names:</b> `query-analytics-dashboard`
- <b>Description:</b> Retrieves analytics data and metrics from your project's dashboard using a simplified natural language search query.
- <b>Examples:</b>
  - How many Clarity sessions did we get from Egypt in the past 3 days?
  - What are the most used browsers in my Clarity project?
  - Show me traffic metrics from my Clarity project for the last week

### Session Recordings
- <b>Names:</b> `list-session-recordings`
- <b>Description:</b> Lists your project's session recordings based on a specified filtering criteria. The filters allow you to narrow down the recordings by various fields such as URLs, device types, browser, OS, country, city, and more.
- <b>Examples:</b>
  - List the most recent Clarity sessions from mobile devices
  - Show the top 5 Clarity sessions with the highest number of user clicks
  - Get Clarity recordings where users encountered JavaScript errors

### AI Visibility: Citations
- <b>Names:</b> `get-citation-overview`, `list-citation-queries`, `list-citation-topics`, `list-top-cited-pages`, `get-citation-metric-trends`, `get-citation-item-trends`
- <b>Description:</b> Retrieves AI Visibility citation metrics, AI referred traffic, queries, topics, top cited pages, and trends for the verified domain configured on your Clarity project.
- <b>Examples:</b>
  - What is my share of authority for non-branded queries over the last 7 days?
  - Which AI queries cite my domain most often this month?
  - Show citation trends for my top three cited pages.

### AI Visibility: Bot Activity
- <b>Names:</b> `get-bot-activity-overview`, `list-ai-crawlers`, `list-bot-path-requests`, `get-bot-activity-distribution`, `get-bot-activity-metric-trends`, `get-bot-activity-item-trends`, `get-ai-crawler-trends`, `get-scrape-to-referral-ratio`, `list-connected-cdn-providers`
- <b>Description:</b> Retrieves read-only Bot Activity analytics for your Clarity project, including AI requests, crawlers, requested paths, content types, page types, HTTP status codes, trends over time, scrape-to-referral ratios, and connected CDN providers. Requires a CDN connected to the project in Clarity.
- <b>Examples:</b>
  - Which AI crawlers requested my site most often in the last 7 days?
  - Which paths did AI bots request most frequently?
  - Show the distribution of AI bot requests by content type.
  - How many AI bot requests returned unsuccessful HTTP status codes?
  - How has the number of site pages crawled changed week over week?
  - Trend the top three crawlers over the last 30 days.
  - How many times does OpenAI scrape my site for each visit it sends back?
  - Why am I not seeing any bot activity data?

### AI Visibility: Topic Insights
- <b>Names:</b> `get-topic-insight-constraints`, `list-topic-insights`, `get-topic-insight-report`, `get-topic-insight-status`, `create-topic-insight-report`, `regenerate-topic-insight-report`, `delete-topic-insight`
- <b>Description:</b> Manages AI Visibility Topic Insights for your Clarity project: retrieves validation rules, topics, reports, and generation status; creates and regenerates reports; and deletes topics. Reports include citation rate, competitive share, and content strengths and opportunities. Requires the project's domain to be verified in Clarity. Creating, regenerating and deleting topics requires an OAuth sign-in and sufficient permissions for the project; deletion must be confirmed first.
- <b>Examples:</b>
  - Which topics am I tracking in Topic Insights?
  - What is my citation rate and competitive share for my top topic?
  - What content opportunities does my latest topic report suggest?

### Documentation Resources
- <b>Names:</b> `query-documentation-resources`
- <b>Description:</b> Retrieves snippets from Microsoft Clarity documentation to find answers to user questions including step-by-step screenshots for setup guides, features, usage, troubleshooting, and integration instructions.
- <b>Examples:</b>
  - How to track custom events using Microsoft Clarity?
  - How many labels can I add to a recording in Microsoft Clarity?

## Migrating from a Data Export API Token

Data Export API token authentication for the MCP server is being deprecated. Migrate to OAuth sign-in using your Microsoft Clarity account by following these steps:

1. Remove `--clarity_api_token` from the MCP server arguments and remove any `CLARITY_API_TOKEN` environment variable.
2. Restart the MCP server.
3. Ask your MCP client to sign in to Microsoft Clarity.
4. Complete sign-in and consent in the browser.
5. The client automatically checks sign-in status; select your default project when prompted.
6. Delete the old token from **Clarity → Settings → Data Export** after confirming OAuth works for your workflow.

## Troubleshooting API Failures

For internal server errors (HTTP 5xx), tools include the API's `X-Request-Id` response header when present. Share this request ID with support if the issue persists so they can trace the failed request. Internal error bodies and stack traces are not exposed.

## Privacy Policy

For information about data privacy and usage, please refer to the [Microsoft Clarity Privacy Policy](https://clarity.microsoft.com/privacy).

## License

This project is licensed under the <b>MIT</b> License.
