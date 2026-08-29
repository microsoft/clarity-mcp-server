// Get configuration from environment variables or command-line arguments
export const getConfigValue = (name: string, fallback?: string): string | undefined => {
  // Check command line args first (format: --name=value or --name value)
  const exactFlag = `--${name}`;
  const valuePrefix = `${exactFlag}=`;
  const argIndex = process.argv.findIndex((arg) => arg === exactFlag || arg.startsWith(valuePrefix));
  if (argIndex !== -1) {
    const arg = process.argv[argIndex];
    if (arg?.startsWith(valuePrefix)) {
      return arg.slice(valuePrefix.length) || fallback;
    }

    // --name value format: return next argument if it exists and isn't another flag
    const nextArg = process.argv[argIndex + 1];
    if (nextArg && !nextArg.startsWith("--")) {
      return nextArg;
    }
  }

  // Then check environment variables
  if (process.env[name] || process.env[name.toUpperCase()]) {
    return process.env[name] || process.env[name.toUpperCase()];
  }

  return fallback;
};

type ToolResult = {
  content: Array<{
    type: "text";
    text: string;
  }>;
};

const textResult = (text: string): ToolResult => ({
  content: [
    {
      type: "text",
      text,
    },
  ],
});

export const describeHttpError = (status: number): string => {
  if (status === 401) {
    return "Microsoft Clarity rejected the API token (HTTP 401). Verify or regenerate the Clarity Data Export API token.";
  }

  if (status === 403) {
    return "Microsoft Clarity denied this request (HTTP 403). Verify that the API token can access the requested Clarity data.";
  }

  if (status === 429) {
    return "Microsoft Clarity rate-limited this request (HTTP 429). Retry after a short delay.";
  }

  if (status >= 500) {
    return `Microsoft Clarity returned a service error (HTTP ${status}). Retry later.`;
  }

  return `Microsoft Clarity rejected the request (HTTP ${status}). Check the request parameters and try again.`;
};

export const tryAsync = async (
  input: string | URL | Request,
  init?: RequestInit | undefined,
): Promise<ToolResult> => {
  // Validate the same environment/command-line token configuration used by the request layer.
  if (!getConfigValue("clarity_api_token")) {
    return textResult(
      "No Clarity API token provided. Configure CLARITY_API_TOKEN or pass --clarity_api_token on the command line.",
    );
  }

  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      await response.body?.cancel();
      console.error(`Microsoft Clarity endpoint request failed with HTTP ${response.status}`);
      return textResult(describeHttpError(response.status));
    }

    try {
      const data = await response.json();
      return textResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Microsoft Clarity endpoint returned invalid JSON:", error);
      return textResult(
        "Microsoft Clarity returned an invalid response. Retry the request; if the problem persists, report it with the tool name and timestamp.",
      );
    }
  } catch (error) {
    console.error("Error reaching Microsoft Clarity endpoint:", error);
    return textResult(
      "Could not reach Microsoft Clarity. Check network connectivity and retry the request.",
    );
  }
};
