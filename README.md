# Clarity MCP Server (Multi-Account)

A [Model Context Protocol](https://modelcontextprotocol.io) server for Microsoft Clarity that supports **multiple projects** — identified by domain name.

Fork of [@microsoft/clarity-mcp-server](https://github.com/microsoft/clarity-mcp-server) with multi-account support.

## Why?

The official server supports one API token at a time. If you manage multiple sites with Clarity, you'd need to run separate server instances. This fork lets you configure all your projects in one place and query any of them by domain name.

## Setup

### 1. Create accounts config

```bash
mkdir -p ~/.clarity-mcp
```

```json
// ~/.clarity-mcp/accounts.json
{
  "default": "mysite.com",
  "accounts": {
    "mysite.com": { "token": "your-clarity-api-token-1" },
    "clientsite.com": { "token": "your-clarity-api-token-2" },
    "blog.example.org": { "token": "your-clarity-api-token-3" }
  }
}
```

### 2. Get your API tokens

Each Clarity project has its own API token. Get them from the [Clarity Data Export API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api).

### 3. Configure your MCP client

```json
{
  "mcpServers": {
    "clarity": {
      "command": "node",
      "args": ["/path/to/clarity-mcp-server-multi/dist/index.js"]
    }
  }
}
```

## Usage

### List accounts
Ask: *"What Clarity accounts are available?"*

### Query a specific site
Ask: *"Show me session recordings for clientsite.com from the last 3 days"*

### Query the default
Ask: *"How many sessions did we get last week?"* (uses default account)

## Tools

| Tool | Description |
|------|-------------|
| `list-clarity-accounts` | List all configured accounts and the default |
| `query-analytics-dashboard` | Natural language analytics queries |
| `list-session-recordings` | Session recordings with filters |
| `query-documentation-resources` | Clarity docs search |

All data tools accept an optional `account` parameter (domain name).

## Backward Compatible

Still works with a single token via CLI arg or env var:

```bash
node dist/index.js --clarity_api_token=your-token
# or
CLARITY_API_TOKEN=your-token node dist/index.js
```

## Config file locations

Checked in order:
1. `--accounts-file=/custom/path.json`
2. `~/.clarity-mcp/accounts.json`
3. `~/.config/clarity-mcp/accounts.json`

## License

MIT
