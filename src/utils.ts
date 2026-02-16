import { CLARITY_API_TOKEN } from "./constants.js";

// Get configuration from environment variables or command-line arguments
export const getConfigValue = (name: string, fallback?: string): string | undefined => {
  // Check command line args first (format: --name=value or --name value)
  const argIndex = process.argv.findIndex((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (argIndex !== -1) {
    const arg = process.argv[argIndex];
    if (arg.includes("=")) {
      return arg.split("=")[1];
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

export const tryAsync = async (input: string | URL | Request, init?: RequestInit | undefined): Promise<any> => {
  // Use provided token or fallback to environment/command-line variables
  // Check if we have the necessary credentials
  if (!CLARITY_API_TOKEN) {
    return {
      content: [
        {
          type: "text",
          text: "No Clarity API token provided. Please provide a token via the 'token' parameter, CLARITY_API_TOKEN environment variable, or --clarity_api_token command-line argument.",
        },
      ],
    };
  }

  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      throw new Error(`Endpoint request failed with status: ${input} ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("Error during fetch:", error);
    return {
      content: [
        {
          type: "text",
          text: "An error occurred while fetching the data.",
        },
      ],
    };
  }
};
