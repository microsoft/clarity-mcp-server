// Endpoint URLs.
export const API_BASE_URL = `https://clarity.microsoft.com/mcp`;
export const SESSION_RECORDINGS_URL = `${API_BASE_URL}/recordings/sample`;
export const ANALYTICS_DASHBOARD_URL = `${API_BASE_URL}/dashboard/query`;
export const DOCUMENTATION_URL = `${API_BASE_URL}/documentation/query`;

// Tool names.
export const ANALYTICS_DASHBOARD_TOOL = "query-analytics-dashboard";
export const DOCUMENTATION_TOOL = "query-documentation-resources";
export const SESSION_RECORDINGS_TOOL = "list-session-recordings";
export const LIST_ACCOUNTS_TOOL = "list-clarity-accounts";

// Tool descriptions.
export const ANALYTICS_DASHBOARD_DESCRIPTION = "Fetch Microsoft Clarity analytics data using a simplified natural language search query. The query should be focused on one specific data retrieval or aggregation task. Avoid complex multi-purpose queries. Time ranges should be explicitly specified when possible. If no time range is provided, prompt the user to specify one. Use the 'account' parameter to specify which site/project to query (by domain name).";
export const DOCUMENTATION_DESCRIPTION = "Retrieve Microsoft Clarity documentation snippets for finding answers to user questions including step-by-step screenshots for setup guides, features, usage, troubleshooting, and integration instructions. The query should be focused on one specific documentation topic or question. Avoid complex multi-purpose queries.";
export const SESSION_RECORDINGS_DESCRIPTION = "List Microsoft Clarity session recordings based on specified filters. The filters allow you to narrow down the recordings by various criteria such as URLs, device types, browser, OS, country, city, and more. The date filter is required and must be in UTC ISO 8601 format. Use the 'account' parameter to specify which site/project to query (by domain name).";
export const LIST_ACCOUNTS_DESCRIPTION = "List all configured Microsoft Clarity accounts/projects available for querying. Returns domain names that can be passed as the 'account' parameter to other tools. Shows which account is the default.";
