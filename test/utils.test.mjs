import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { describeHttpError, getConfigValue, tryAsync } from "../.test-dist/utils.js";

const originalToken = process.env.CLARITY_API_TOKEN;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.CLARITY_API_TOKEN = "test-token";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) {
    delete process.env.CLARITY_API_TOKEN;
  } else {
    process.env.CLARITY_API_TOKEN = originalToken;
  }
});

test("getConfigValue does not match longer command-line flag names", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "test", "--clarity_api_token_extra=wrong"];
  delete process.env.CLARITY_API_TOKEN;

  try {
    assert.equal(getConfigValue("clarity_api_token"), undefined);
  } finally {
    process.argv = originalArgv;
  }
});

test("tryAsync returns successful JSON as MCP text content", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ sessions: 12 }),
  });

  const result = await tryAsync("https://clarity.microsoft.com/mcp/dashboard/query");
  assert.equal(result.content[0].text, '{\n  "sessions": 12\n}');
});

test("tryAsync gives accurate token configuration guidance", async () => {
  delete process.env.CLARITY_API_TOKEN;

  const result = await tryAsync("https://clarity.microsoft.com/mcp/dashboard/query");
  assert.match(result.content[0].text, /Configure CLARITY_API_TOKEN/);
  assert.doesNotMatch(result.content[0].text, /token parameter/);
});

for (const [status, expected] of [
  [401, /rejected the API token/],
  [403, /denied this request/],
  [429, /rate-limited/],
  [500, /service error/],
]) {
  test(`tryAsync preserves actionable HTTP ${status} diagnostics`, async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status,
      json: async () => ({}),
    });

    const result = await tryAsync("https://clarity.microsoft.com/mcp/dashboard/query");
    assert.match(result.content[0].text, expected);
    assert.match(result.content[0].text, new RegExp(String(status)));
  });
}

test("tryAsync cancels failed response bodies before returning", async () => {
  let cancelled = false;
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    body: {
      cancel: async () => {
        cancelled = true;
      },
    },
  });

  const result = await tryAsync("https://clarity.microsoft.com/mcp/dashboard/query");
  assert.equal(cancelled, true);
  assert.match(result.content[0].text, /service error/);
});

test("describeHttpError handles other client errors without exposing response bodies", () => {
  assert.equal(
    describeHttpError(400),
    "Microsoft Clarity rejected the request (HTTP 400). Check the request parameters and try again.",
  );
});

test("tryAsync distinguishes invalid JSON from endpoint failures", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("invalid JSON");
    },
  });

  const result = await tryAsync("https://clarity.microsoft.com/mcp/dashboard/query");
  assert.match(result.content[0].text, /invalid response/);
});

test("tryAsync distinguishes network failures", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("network unavailable");
  };

  const result = await tryAsync("https://clarity.microsoft.com/mcp/dashboard/query");
  assert.match(result.content[0].text, /Could not reach Microsoft Clarity/);
});
