#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ClarityService } from './service.js';
import { ClarityDimension } from './types.js';
import { parseArgs } from 'node:util';

// Interface for server creation options
export interface ClarityServerOptions {
  token: string;
  projectId?: string;
}

/**
 * Creates a Clarity MCP server instance
 * @param options Server options with API token and optional project ID
 * @returns Configured MCP server instance
 */
export function createServer(options: ClarityServerOptions): McpServer {
  if (!options.token) {
    throw new Error('API token is required to create a Clarity MCP server');
  }

  // Create the Clarity service
  const clarityService = new ClarityService(options.token);

  // Create MCP server instance
  const server = new McpServer({
    name: "clarity-data-export",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Tool: Get traffic data
  server.tool(
    "get-traffic",
    "Get traffic data from Microsoft Clarity",
    {
      days: z.number().min(1).max(3).describe("Number of days (1-3) to retrieve data for"),
      dimensions: z.array(z.enum([
        ClarityDimension.Browser,
        ClarityDimension.Device, 
        ClarityDimension.CountryRegion, 
        ClarityDimension.OS, 
        ClarityDimension.Source, 
        ClarityDimension.Medium, 
        ClarityDimension.Campaign, 
        ClarityDimension.Channel, 
        ClarityDimension.URL, 
        ClarityDimension.PageTitle, 
        ClarityDimension.ReferrerURL
      ] as [string, ...string[]]))
      .max(3)
      .optional()
      .describe("Up to 3 dimensions to break down insights (Browser, Device, Country/Region, OS, Source, etc)"),
    },
    async ({ days, dimensions = [] }) => {
      try {
        // Validate dimensions count
        if (dimensions.length > 3) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Maximum of 3 dimensions can be passed in a single request.",
              },
            ],
          };
        }

        // Get remaining API request count
        const remainingRequests = clarityService.getRemainingRequests();
        if (remainingRequests <= 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Daily API request limit exceeded (10 requests per day).",
              },
            ],
          };
        }

        const params = {
          numOfDays: days as 1 | 2 | 3,
          dimension1: dimensions[0] as ClarityDimension,
          dimension2: dimensions[1] as ClarityDimension,
          dimension3: dimensions[2] as ClarityDimension,
          projectId: options.projectId || undefined
        };

        // Fetch data from Clarity API
        const data = await clarityService.fetchData(params);
        
        // Format data for display
        const formattedData = clarityService.formatResponseData(data);
        
        return {
          content: [
            {
              type: "text",
              text: formattedData + `\n\nRemaining API requests for today: ${clarityService.getRemainingRequests()}/10`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${(error as Error).message}`,
            },
          ],
        };
      }
    },
  );

  // Tool: Get user metrics
  server.tool(
    "get-metrics",
    "Get specific metrics from Microsoft Clarity",
    {
      days: z.number().min(1).max(3).describe("Number of days (1-3) to retrieve data for"),
      metrics: z.enum([
        'Traffic',
        'Popular Pages',
        'Browser',
        'Device',
        'OS',
        'Country/Region',
        'Scroll Depth',
        'Engagement Time'
      ] as [string, ...string[]]).describe("Metric to retrieve data for"),
      dimensions: z.array(z.enum([
        ClarityDimension.Browser,
        ClarityDimension.Device, 
        ClarityDimension.CountryRegion, 
        ClarityDimension.OS, 
        ClarityDimension.Source, 
        ClarityDimension.Medium, 
        ClarityDimension.Campaign, 
        ClarityDimension.Channel, 
        ClarityDimension.URL, 
        ClarityDimension.PageTitle, 
        ClarityDimension.ReferrerURL
      ] as [string, ...string[]]))
      .max(3)
      .optional()
      .describe("Up to 3 dimensions to break down insights"),
    },
    async ({ days, metrics, dimensions = [] }) => {
      try {
        // Validate dimensions count
        if (dimensions.length > 3) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Maximum of 3 dimensions can be passed in a single request.",
              },
            ],
          };
        }

        // Get remaining API request count
        const remainingRequests = clarityService.getRemainingRequests();
        if (remainingRequests <= 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Daily API request limit exceeded (10 requests per day).",
              },
            ],
          };
        }

        const params = {
          numOfDays: days as 1 | 2 | 3,
          dimension1: dimensions[0] as ClarityDimension,
          dimension2: dimensions[1] as ClarityDimension,
          dimension3: dimensions[2] as ClarityDimension,
          projectId: options.projectId || undefined
        };

        // Fetch data from Clarity API
        const data = await clarityService.fetchData(params);
        
        // Filter data to only the requested metric
        const filteredData = data.filter(item => item.metricName === metrics);
        
        // Format data for display
        const formattedData = clarityService.formatResponseData(filteredData);
        
        return {
          content: [
            {
              type: "text",
              text: formattedData + `\n\nRemaining API requests for today: ${clarityService.getRemainingRequests()}/10`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${(error as Error).message}`,
            },
          ],
        };
      }
    },
  );

  // Tool: Get API information
  server.tool(
    "get-api-info",
    "Get information about Microsoft Clarity API limits and status",
    {},
    async () => {
      try {
        const remainingRequests = clarityService.getRemainingRequests();
        
        const apiInfo = `
# Microsoft Clarity API Information

## API Limits
- Maximum of 10 API requests are allowed per project per day
- Data retrieval is confined to the previous 1 to 3 days
- Maximum of three dimensions can be passed in a single request
- The response is limited to 1,000 rows and can't be paginated

## Current Status
- Remaining API requests for today: ${remainingRequests}/10
- Project ID: ${options.projectId || 'Not specified'}

## Available Dimensions
${Object.values(ClarityDimension).map(dim => `- ${dim}`).join('\n')}

## Available Metrics
- Traffic
- Popular Pages
- Browser
- Device
- OS
- Country/Region
- Scroll Depth
- Engagement Time
`;
        
        return {
          content: [
            {
              type: "text",
              text: apiInfo,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${(error as Error).message}`,
            },
          ],
        };
      }
    },
  );

  return server;
}

// Parse command-line arguments when run directly
if (import.meta.url === import.meta.resolve('.') || process.argv.includes('--help') || process.argv.includes('-h')) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      token: {
        type: 'string',
        short: 't',
        default: '',
      },
      projectId: {
        type: 'string',
        short: 'p',
        default: '',
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      }
    },
    allowPositionals: true,
  });

  // Display help if requested or no arguments provided
  if (values.help || process.argv.length <= 2) {
    console.log(`
Clarity Data Export MCP Server

Usage: clarity-mcp --token=YOUR_API_TOKEN [--projectId=YOUR_PROJECT_ID]

Options:
  -t, --token      Microsoft Clarity API token (required)
  -p, --projectId  Microsoft Clarity Project ID (optional)
  -h, --help       Display this help message
  `);
    process.exit(0);
  }

  // Validate required arguments
  const apiToken = values.token;
  if (!apiToken) {
    console.error('Error: API token is required. Use --token=YOUR_API_TOKEN or -t YOUR_API_TOKEN');
    console.error('For more information, use --help');
    process.exit(1);
  }

  // Create and run server
  const server = createServer({
    token: apiToken,
    projectId: values.projectId
  });

  // Main function to run the server
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Clarity Data Export MCP Server running on stdio");
    if (values.projectId) {
      console.error(`Using Project ID: ${values.projectId}`);
    }
  }

  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
