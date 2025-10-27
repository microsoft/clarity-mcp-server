# Microsoft Clarity MCP Server

This is a Model Context Protocol (MCP) server for the Microsoft Clarity.
It allows you to access your session recordings, project analytics, and documentation from Clarity using Claude for Desktop or other MCP-compatible clients.

## Key Features

- **Analytics Data Access**: Query your Microsoft Clarity analytics data including traffic metrics, user behavior insights, and performance statistics
- **Session Recording Retrieval**: Access and analyze session recordings to understand user interactions and identify optimization opportunities
- **Natural Language Querying**: Ask questions in plain English to get insights from your data - no need to learn complex query syntax or API endpoints
- **Flexible Data Filtering**: Filter results by various dimensions such as browser, device, country, and many more
- **Real-Time Data Access**: Fetch the latest analytics data and insights from your Clarity projects on-demand
- **Documentation Integration**: Get quick answers and guidance from Microsoft Clarity documentation directly within your workflow
- **Seamless MCP Integration**: Works natively with Claude for Desktop, Visual Studio Code, and other Model Context Protocol (MCP) compatible clients

## Setup and Installation

### Prerequisites

- Node.js v16 or higher
- A Microsoft Clarity account and API token
- Any MCP-compatible client (Claude for Desktop, etc.)

### Installation

#### Option 1: Install via npm (recommended)

You can install and run this package directly using npm:

```bash
# Install globally
npm install -g @microsoft/clarity-mcp-server

# Run the server
clarity-mcp-server
```

#### Option 2: Run with npx without installing

You can run the server directly using npx without installing:

```bash
npx @microsoft/clarity-mcp-server
```

With either option, you can provide your Clarity API token using the `--clarity_api_token` parameter:

```bash
npx @microsoft/clarity-mcp-server --clarity_api_token=your-token-here
```

#### Option 3: Manual Installation

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the TypeScript code:
   ```
   npm run build
   ```
4. Run the server:
   ```
   npm run start
   ```

### Extension/Plugin Installation

#### Visual Studio Code Extension

[<img src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install+Server&color=0098FF" alt="Install in VS Code">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522clarity-server%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540microsoft%252Fclarity-mcp-server%2522%255D%257D)

Click the button above to install the Microsoft Clarity MCP server directly in Visual Studio Code.

#### Claude Desktop Plugin

Install from Claude's extension gallery:

1. Open **Claude Desktop**
2. Navigate to **File → Settings → Extensions**
3. Search for **Microsoft Clarity**
4. Click **Install** to add the extension
5. Configure your **API Token**:
   <br>
   Follow the instructions in the [API Token section](#api-token) to retrieve and set it up correctly.

## Configuration

You can provide the [Clarity data export API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api) token in two ways:

1. **Command Line Arguments**:
   ```bash
   npx @microsoft/clarity-mcp-server --clarity_api_token=your-token
   ```

2. **Tool Parameters**:
   <br>
   Provide `token` as a parameter when calling the `get-clarity-data` tool

## Configuring MCP Clients

### Generic MCP Client Configuration

MCP clients typically require configuration to connect to the server. Here's a general example of how to configure an MCP client:

```json
{
  "mcpServers": {
    "@microsoft/clarity-mcp-server": {
      "command": "npx",
      "args": [
        "@microsoft/clarity-mcp-server",
        "--clarity_api_token=your-api-token-here"
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
2. Add the configuration shown in the generic example above
3. Save the configuration file and restart Claude for Desktop

## Server Usage

The server exposes various tools that you can call from any MCP client.
Just ask naturally and keep each request focused on one thing.

### Query Analytics Dashboard
- <b>Name:</b> `query-analytics-dashboard`
- <b>Description:</b> Retrieves analytics data and metrics from your project's dashboard using a simplified natural language search query.
- <b>Examples:</b>
  - How many Clarity sessions did we get from Egypt in the past 3 days?
  - What are the most used browsers in my Clarity project?
  - Show me traffic metrics from my Clarity project for the last week

### List Session Recordings
- <b>Name:</b> `list-session-recordings`
- <b>Description:</b> Lists your project's session recordings based on a specified filtering criteria. The filters allow you to narrow down the recordings by various fields such as URLs, device types, browser, OS, country, city, and more.
- <b>Examples:</b>
  - List the most recent Clarity sessions from mobile devices
  - Show the top 5 Clarity sessions with the highest number of user clicks
  - Get Clarity recordings where users encountered JavaScript errors

### Query Documentation Resources
- <b>Name:</b> `query-documentation-resources`
- <b>Description:</b> Retrieves snippets from Microsoft Clarity documentation to find answers to user questions including step-by-step screenshots for setup guides, features, usage, troubleshooting, and integration instructions.
- <b>Examples:</b>
  - How to track custom events using Microsoft Clarity?
  - How many labels can I add to a recording in Microsoft Clarity?

## API Token

### Getting Your API Token

To generate an API token:

1. Go to your Clarity project
2. Select Settings → Data Export → Generate new API token
3. Provide a descriptive name for the token
4. Save the generated token securely

## Privacy Policy

For information about data privacy and usage, please refer to the [Microsoft Clarity Privacy Policy](https://clarity.microsoft.com/privacy).

## License

This project is licensed under the <b>MIT</b> License.
