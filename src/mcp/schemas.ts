import { z } from "zod";

export const SearchQuery = z.string().describe("A natural language search query string for filtering and shaping analytics data. The query should be specific and include temporal constraints when available. (e.g., 'Top browsers last 3 days', 'The active time duration for mobile devices in United States last week'). Time ranges should be explicitly specified when possible. If no time range is provided, prompt the user to specify one.");

export const ProjectId = z.string().trim().min(1).optional().describe("Optional id of the Clarity project to query, as returned by list-projects. Omit to query the selected project. To compare several projects, call this tool once per project with its id. Passing it does not change the selected project. Not supported with a Data Export API token, which always queries its own project.");
