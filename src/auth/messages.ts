import { LOGIN_TOOL } from "../features/auth/tools.js";

// Messages shared by the Clarity tools.

export function getNotSignedInMessage(): string {
  return `Not signed in to Microsoft Clarity. Call the \`${LOGIN_TOOL}\` tool to sign in with a Clarity account, or configure a Clarity Data Export API token via the CLARITY_API_TOKEN environment variable or the --clarity_api_token command-line argument.`;
}

export function getSignInEndedMessage(): string {
  return `Your Microsoft Clarity sign-in has ended. Call the \`${LOGIN_TOOL}\` tool to sign in again.`;
}

// A Data Export token is tied to one project and cannot list projects, so project choices need a sign-in, which then
// takes precedence over the token.
export function getDataExportTokenSingleProjectMessage(): string {
  return `The Clarity tools are using the configured Data Export API token, which is tied to a single project: the tools always query that project, and projects cannot be listed, selected or passed as projectId. To work with other projects, call the \`${LOGIN_TOOL}\` tool to sign in with a Clarity account; the sign-in is then used instead of the token.`;
}
