/** Message returned when an unexpected Clarity API request failure occurs. */
export const CLARITY_REQUEST_FAILED_MESSAGE = "Unable to complete the Microsoft Clarity request. Please try again shortly.";

export const CLARITY_SERVER_ERROR_MESSAGE = "Microsoft Clarity encountered an internal server error. Please try again shortly.";

export function withRequestId(response: Response, message: string): string {
  const requestId = response.headers.get("X-Request-Id")?.trim();
  return message + (requestId ? ` If the issue persists, contact support with X-Request-Id: ${requestId}.` : "");
}

// The service answers a project whose AI Visibility domain is not verified with a 403 carrying this error code.
export const AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR = "ai_visibility_domain_not_verified";

export const AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE = "AI Visibility data is not available for this project because its domain has not been verified. Ask the user to verify the project's domain in the AI Visibility section of Microsoft Clarity, then try again.";
