# Microsoft Clarity Data Export MCP Server

This is a Model Context Protocol (MCP) server for the Microsoft Clarity data export API. It allows you to fetch analytics data from Clarity using Claude for Desktop or other MCP-compatible clients.

## Features

- Query Microsoft Clarity analytics data through a simple interface
- Filter by up to 3 dimensions (Browser, Device, Country/Region, OS, etc.)
- Retrieve various metrics (Scroll Depth, Engagement Time, Traffic, etc.)
- Seamlessly integrates with Claude for Desktop

## Setup and Installation

### Prerequisites

- Node.js v16 or higher
- A Microsoft Clarity account and API token
- Claude for Desktop (or other MCP client)

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
   npm start
   ```

## Configuration

You can provide the [Clarity data export API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api) token in two ways:

1. **Command Line Arguments**:
   ```bash
   npx @microsoft/clarity-mcp-server --clarity_api_token=your-token
   ```

2. **Tool Parameters**:
   - Provide `token` as a parameter when calling the `get-clarity-data` tool

## Running with Claude for Desktop

### Option 1: Using VS Code and MCP Configuration

1. Open the project folder in VS Code
2. Edit the `.vscode/mcp.json` file and set your credentials:
   ```json
   {
     "servers": {
       "@microsoft/clarity-mcp-server": {
         "type": "stdio",
         "command": "npx",
         "args": ["@microsoft/clarity-mcp-server", "--clarity_api_token=your-api-token-here"]
       }
     }
   }
   ```

3. Launch Claude for Desktop

Claude for Desktop should automatically detect the server through the VS Code integration.

### Option 2: Manual Configuration

To manually configure Claude for Desktop to use this server:

1. Open your Claude for Desktop configuration file:
   - **Windows**: `%AppData%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the following configuration:

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

3. Save the configuration file and restart Claude for Desktop

## Using the Server

When using Claude with this server configured, you can ask it to fetch Clarity data. For example:

"Can you fetch my Clarity data for the last day, filtered by Browser and showing Traffic metrics?"

Claude will then prompt you to run the `get-clarity-data` tool, which requires:
- `numOfDays`: Number of days to retrieve (1-3)
- `dimensions`: Array of dimensions to filter by (optional)
- `metrics`: Array of metrics to retrieve (optional)

If you haven't configured your credentials via command-line arguments, you'll also need to provide:
- `token`: Your Clarity API token

## API Token

### Getting Your API Token

To generate an API token:

1. Go to your Clarity project
2. Select Settings -> Data Export -> Generate new API token
3. Provide a descriptive name for the token
4. Save the generated token securely

## Limitations

- Maximum of 10 API requests are allowed per project per day
- Data retrieval is confined to the previous 1 to 3 days
- Maximum of three dimensions can be passed in a single request
- The response is limited to 1,000 rows and can't be paginated

## License

MIT
