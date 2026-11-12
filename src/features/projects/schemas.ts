import { z } from "zod";

export const ListProjectsRequest = {
  refresh: z.boolean().optional().describe("Re-read the projects from Clarity instead of reusing the recent list, e.g. after the user gained or lost access to a project."),
};

export const SelectProjectRequest = {
  projectId: z.string().trim().min(1).describe("The id of the project to query, as returned by list-projects."),
};
