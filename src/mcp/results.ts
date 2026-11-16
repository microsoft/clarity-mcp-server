// The result that an MCP tool returns to the client.
export interface ToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string; }[];
  isError?: boolean;
}

// A text reply from an MCP tool; isError marks it as a failure the assistant should relay.
export const textResult = (text: string, isError = false): ToolResult => ({
  content: [{ type: "text", text }],
  ...(isError ? { isError: true } : {}),
});
