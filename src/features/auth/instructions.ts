import { LOGIN_STATUS_TOOL, LOGIN_TOOL, LOGOUT_TOOL } from "./tools.js";

export const AUTH_INSTRUCTIONS = `
## Authentication

The Clarity tools use the user's Clarity sign-in when there is one, otherwise a configured Data Export API token.
- If a tool reports that the user is not signed in, call \`${LOGIN_TOOL}\`. It opens the Clarity sign-in page in the browser and returns its link; show the link and tell the user to sign in there. Immediately call \`${LOGIN_STATUS_TOOL}\`, which waits up to 10 seconds for the browser callback and returns immediately on completion or failure, and repeat while \`loginPending\` is true. Do not ask whether sign-in is finished, present a confirmation form, or wait for a chat reply. The server receives the authorization code and exchanges tokens automatically after the browser redirects.
- Check \`lastLoginError\` on every status response. If set, report the failure and stop checking; do not retry the original request or claim sign-in succeeded. Retry the original request only after \`signedIn\` is true and \`loginPending\` is false with no login error.
- Tell the user that requests to each project are restricted by their admin or member permissions for that project. OAuth scopes are not requested and do not determine API permissions; signing in does not elevate their project role. Do not suggest signing in again to gain a missing project permission.
- Call \`${LOGOUT_TOOL}\` only when the user asks to sign out or to switch accounts.
- Never ask the user to paste tokens or passwords into the chat.
`;
