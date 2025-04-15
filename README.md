# Clarity MCP Server

A Model Context Protocol (MCP) server for interacting with the Microsoft Clarity Data Export API. This server enables AI assistants to access website analytics data through Clarity's API.

## Key Features

- **Fast analytics access**: Get website traffic data with customizable dimensions
- **LLM-friendly**: Retrieve specific metrics like browser usage, device types, engagement, etc.
- **Built-in limitations handling**: Respects API rate limiting and tracks usage

## Use Cases

- **Website traffic analysis**: Get insights about website visitors
- **User behavior understanding**: Access engagement metrics and identify issues
- **Analytics reporting**: Generate reports from Clarity data

## Example config

```json
{
  "mcpServers": {
    "clarity-data-export": {
      "command": "npx",
      "args": ["@microsoft/clarity-mcp-server", "--token=YOUR_API_TOKEN", "--projectId=YOUR_PROJECT_ID"]
    }
  }
}
```

## Installation in VS Code

Install the Clarity MCP server in VS Code using the VS Code CLI:

```bash
code --add-mcp '{"name":"clarity-data-export","command":"npx","args":["@microsoft/clarity-mcp-server","--token=YOUR_API_TOKEN","--projectId=YOUR_PROJECT_ID"]}'
```

## Installation via npm

```bash
npm install -g @microsoft/clarity-mcp-server
```

Then run using:

```bash
clarity-mcp --token=YOUR_API_TOKEN --projectId=YOUR_PROJECT_ID
```

## CLI Options

The Clarity MCP server supports the following command-line options:

- `-t, --token`: Microsoft Clarity API token (required)
- `-p, --projectId`: Microsoft Clarity Project ID (optional)
- `-h, --help`: Display help message

## Server Tools

### Website Analytics Tools

- **get-traffic**
  - Description: Get traffic data from Microsoft Clarity
  - Parameters:
    - `days`: Number of days (1-3) to retrieve data for
    - `dimensions`: (Optional) Up to 3 dimensions to break down insights

- **get-metrics**
  - Description: Get specific metrics from Microsoft Clarity
  - Parameters:
    - `days`: Number of days (1-3) to retrieve data for
    - `metrics`: Metric to retrieve data for (Traffic, Popular Pages, Browser, etc.)
    - `dimensions`: (Optional) Up to 3 dimensions to break down insights

- **get-api-info**
  - Description: Get information about Microsoft Clarity API limits and status
  - Parameters: None

## Limitations

- Maximum of 10 API requests are allowed per project per day (Microsoft Clarity limitation)
- Data retrieval is confined to the previous 1 to 3 days
- Maximum of three dimensions can be passed in a single request
- The response is limited to 1,000 rows and can't be paginated

## Programmatic usage

```typescript
import { createServer } from '@microsoft/clarity-mcp-server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create server with your token
const server = createServer({
  token: 'YOUR_API_TOKEN',
  projectId: 'YOUR_PROJECT_ID'
});

// Connect using stdio transport
const transport = new StdioServerTransport();
server.connect(transport);
```

## License

ISC
