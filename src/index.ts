import { randomUUID } from "node:crypto";

import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import pkg from "../package.json" with { type: "json" };

import {
  ANALYTICS_DASHBOARD_DESCRIPTION,
  ANALYTICS_DASHBOARD_TOOL,
  CLARITY_API_TOKEN,
  DOCUMENTATION_DESCRIPTION,
  DOCUMENTATION_TOOL,
  SESSION_RECORDINGS_DESCRIPTION,
  SESSION_RECORDINGS_TOOL
} from "./constants.js";
import {
  SYSTEM_INSTRUCTIONS_PROMPT
} from "./instructions.js";
import {
  listSessionRecordingsAsync,
  queryAnalyticsDashboardAsync,
  queryDocumentationAsync
} from "./tools.js";
import {
  ListRequest,
  SearchRequest,
} from "./types.js";

function createServer(): McpServer {
  const server = new McpServer(
    {
      name: pkg.name,
      version: pkg.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      },
      instructions: SYSTEM_INSTRUCTIONS_PROMPT,
    }
  );

  server.tool(
    ANALYTICS_DASHBOARD_TOOL,
    ANALYTICS_DASHBOARD_DESCRIPTION,
    SearchRequest,
    {
      title: "Query Analytics Dashboard",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ query }) => {
      return await queryAnalyticsDashboardAsync(query, Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  );

  server.tool(
    SESSION_RECORDINGS_TOOL,
    SESSION_RECORDINGS_DESCRIPTION,
    ListRequest,
    {
      title: "List Session Recordings",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ filters, sortBy, count }) => {
      const now = new Date().toISOString();

      const endDate = new Date(filters?.date?.end || now);
      const startDate = new Date(filters?.date?.start || now);

      if (!filters?.date?.start) {
        startDate.setDate(endDate.getDate() - 2);
      }

      return await listSessionRecordingsAsync(startDate, endDate, filters, sortBy, count);
    }
  );

  server.tool(
    DOCUMENTATION_TOOL,
    DOCUMENTATION_DESCRIPTION,
    SearchRequest,
    {
      title: "Query Documentation Resources",
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    async ({ query }) => {
      return await queryDocumentationAsync(query);
    }
  );

  return server;
}

function logTokenStatus(): void {
  if (CLARITY_API_TOKEN) {
    console.error("Clarity API token configured via environment/command-line");
  } else {
    console.error("No Clarity API token configured, it must be provided with each request");
  }
}

function parseHttpPort(): number | undefined {
  const portValue = process.env.PORT;
  if (portValue === undefined || portValue === "") {
    return undefined;
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${portValue}`);
  }

  return port;
}

async function runStdioServer(): Promise<void> {
  logTokenStatus();

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Microsoft Clarity Data Export MCP Server running on stdio...");
}

async function runHttpServer(port: number): Promise<void> {
  logTokenStatus();

  const app = createMcpExpressApp({ host: "0.0.0.0" });
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  const handleMcpRequest = async (req: Request, res: Response): Promise<void> => {
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    try {
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports[id] = transport!;
          },
        });

        transport.onclose = () => {
          const sid = transport?.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };

        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  };

  app.post("/mcp", (req, res) => {
    void handleMcpRequest(req, res);
  });

  app.get("/mcp", (req, res) => {
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    void transports[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", (req, res) => {
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    void transports[sessionId].handleRequest(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    app.listen(port, "0.0.0.0", (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      console.error(`Microsoft Clarity Data Export MCP Server running on http://0.0.0.0:${port}/mcp`);
      resolve();
    });
  });
}

async function main() {
  const port = parseHttpPort();

  if (port !== undefined) {
    await runHttpServer(port);
    return;
  }

  await runStdioServer();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
