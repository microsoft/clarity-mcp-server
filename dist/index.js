import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Get configuration from environment variables or command-line arguments
const getConfigValue = (name, fallback) => {
    // Check command line args first (format: --name=value)
    const commandArg = process.argv.find(arg => arg.startsWith(`--${name}=`));
    if (commandArg) {
        return commandArg.split('=')[1];
    }
    // Check environment variables
    const envValue = process.env[name.toUpperCase()] || process.env[name];
    if (envValue) {
        return envValue;
    }
    return fallback;
};
// Create server instance
const server = new McpServer({
    name: "@microsoft/clarity-mcp-server",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Constants for API
const API_BASE_URL = "https://www.clarity.ms/export-data/api/v1/project-live-insights";
// Available metrics that may be returned by the API
const AVAILABLE_METRICS = [
    "ScrollDepth",
    "EngagementTime",
    "Traffic",
    "PopularPages",
    "Browser",
    "Device",
    "OS",
    "Country/Region",
    "PageTitle",
    "ReferrerURL",
    "DeadClickCount",
    "ExcessiveScroll",
    "RageClickCount",
    "QuickbackClick",
    "ScriptErrorCount",
    "ErrorClickCount"
];
// Available dimensions that can be used in queries
const AVAILABLE_DIMENSIONS = [
    "Browser",
    "Device",
    "Country/Region",
    "OS",
    "Source",
    "Medium",
    "Campaign",
    "Channel",
    "URL"
];
// Helper function to make API requests
async function fetchClarityData(token, numOfDays, dimensions = []) {
    try {
        // Build parameters for the API request
        const params = new URLSearchParams();
        params.append("numOfDays", numOfDays.toString());
        // Add dimensions if specified (maximum 3 allowed)
        dimensions.slice(0, 3).forEach((dim, index) => {
            params.append(`dimension${index + 1}`, dim);
        });
        // Make the API request
        const url = `${API_BASE_URL}?${params.toString()}&src=mcp`;
        console.error(`Making request to: ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error fetching Clarity data:", error);
        return { error: error instanceof Error ? error.message : "Unknown error" };
    }
}
// Register the get-clarity-data tool
server.tool("get-clarity-data", "Fetch Microsoft Clarity analytics data", {
    numOfDays: z.number().min(1).max(3).describe("Number of days to retrieve data for (1-3)"),
    dimensions: z.array(z.string()).optional().describe("Up to 3 dimensions to filter by (Browser, Device, Country/Region, OS, Source, Medium, Campaign, Channel, URL)"),
    metrics: z.array(z.string()).optional().describe("Metrics to retrieve (Scroll Depth, Engagement Time, Traffic, Popular Pages, Browser, Device, OS, Country/Region, etc.)"),
    token: z.string().optional().describe("Your Clarity API token (optional if provided via environment or command line)"),
}, async ({ numOfDays, dimensions = [], metrics = [], token }) => {
    // Use provided token or fallback to environment/command-line variables
    // const finalToken = token || CLARITY_API_TOKEN;
    const finalToken = token || getConfigValue('clarity_api_token') || getConfigValue('CLARITY_API_TOKEN'); // Check if we have the necessary credentials
    if (!finalToken) {
        return {
            content: [
                {
                    type: "text",
                    text: "No Clarity API token provided. Please provide a token via the 'token' parameter, CLARITY_API_TOKEN environment variable, or --clarity_api_token command-line argument.",
                },
            ],
        };
    }
    // Validate dimensions against known valid dimensions
    const filteredDimensions = dimensions.filter(d => AVAILABLE_DIMENSIONS.includes(d));
    if (filteredDimensions.length < dimensions.length) {
        console.warn("Some dimensions were invalid and have been filtered out");
    }
    // Fetch data from Clarity API
    const data = await fetchClarityData(finalToken, numOfDays, filteredDimensions);
    // Check for errors
    if (data.error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching data: ${data.error}`,
                },
            ],
        };
    }
    // Filter metrics if specified
    let formattedResult = data;
    if (metrics && metrics.length > 0) {
        // Filter the metrics if requested (case-insensitive match for user convenience)
        formattedResult = data.filter((item) => metrics.some(m => item.metricName.toLowerCase() === m.toLowerCase() ||
            item.metricName.replace(/\s+/g, '').toLowerCase() === m.replace(/\s+/g, '').toLowerCase()));
    }
    const resultText = JSON.stringify(formattedResult, null, 2);
    return {
        content: [
            {
                type: "text",
                text: resultText,
            },
        ],
    };
});
// Main function
async function main() {
    // Log configuration status
    if (getConfigValue('clarity_api_token') || getConfigValue('CLARITY_API_TOKEN')) {
        console.error("Clarity API token configured via environment/command-line");
    }
    else {
        console.error("No Clarity API token configured, it must be provided with each request");
    }
    console.error(`Supported metrics: ${AVAILABLE_METRICS.join(", ")}`);
    console.error(`Supported dimensions: ${AVAILABLE_DIMENSIONS.join(", ")}`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Microsoft Clarity Data Export MCP Server running on stdio");
}
// Run the server
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
