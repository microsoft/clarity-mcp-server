// A project as returned by the Clarity projects list endpoint.
export interface ProjectSummary {
  projectId: string;
  name: string | null;
  hostname: string | null;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
  error?: string;
  // The stored sign-in was revoked or expired and has been removed.
  signInEnded?: boolean;
}
