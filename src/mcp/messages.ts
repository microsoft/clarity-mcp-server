/** Message returned when an unexpected Clarity API request failure occurs. */
export const CLARITY_REQUEST_FAILED_MESSAGE = "Unable to complete the Microsoft Clarity request. Please try again shortly.";

export function getServerErrorMessage(response: Response): string {
  const requestId = response.headers.get("X-Request-Id")?.trim();
  return "Microsoft Clarity encountered an internal server error. Please try again shortly." +
    (requestId ? ` If the issue persists, contact support with request ID: ${requestId}.` : "");
}

// The service answers a project whose AI Visibility domain is not verified with a 403 carrying this error code.
export const AI_VISIBILITY_DOMAIN_NOT_VERIFIED_ERROR = "ai_visibility_domain_not_verified";

export const AI_VISIBILITY_DOMAIN_NOT_VERIFIED_MESSAGE = "AI Visibility data is not available for this project because its domain has not been verified. Ask the user to verify the project's domain in the AI Visibility section of Microsoft Clarity, then try again.";
