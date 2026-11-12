import { spawn } from "node:child_process";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { ServerResponse } from "node:http";
import { createServer } from "node:net";
import { homedir } from "node:os";

// Helpers for the OAuth client: PKCE, the cross-process refresh lock, the sign-in result page and opening the browser.

const REFRESH_LOCK_WAIT_MS = 70 * 1000;

// PKCE (RFC 7636) verifier and S256 challenge, plus the state that ties the callback to this sign-in.
export function createPkce(): { codeVerifier: string; codeChallenge: string; state: string; } {
  const codeVerifier = randomBytes(32).toString("base64url");
  return {
    codeVerifier,
    codeChallenge: createHash("sha256").update(codeVerifier).digest("base64url"),
    state: randomBytes(32).toString("base64url"),
  };
}

// Hashes the user's home directory and Clarity origin so their MCP processes select the same lock port.
// The null separator keeps the inputs distinct; the first two hash bytes are mapped to ports 49152-65535.
// A collision causes extra waiting rather than concurrent refreshes.
export function refreshLockPortFor(origin: string): number {
  return 49152 + createHash("sha256").update(`${homedir()}\0${origin}`).digest().readUInt16BE(0) % 16384;
}

// Exclusively binds a loopback port to serialize rotating refresh-token updates across processes; no data is exchanged.
// Retries an occupied port for up to 70 seconds, then fails rather than allowing an unlocked refresh.
// Returns an idempotent release function that closes only this listener. The OS also releases it if the process exits.
export async function acquireRefreshLock(port: number): Promise<() => Promise<void>> {
  const deadline = Date.now() + REFRESH_LOCK_WAIT_MS;
  for (; ;) {
    const server = createServer((socket) => socket.destroy());
    try {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen({ port, host: "127.0.0.1", exclusive: true }, () => {
          server.removeListener("error", reject);
          resolve();
        });
      });
      let released: Promise<void> | null = null;
      return () => released ??= new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") {
        throw error;
      }
    }
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for another Clarity MCP server to finish refreshing the sign-in.");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function respondPage(res: ServerResponse, status: number, title: string, message: string): void {
  if (res.headersSent) {
    return;
  }
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  });
  res.end(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>` +
    `<body style="font-family:Segoe UI,system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:0 16px">` +
    `<h1 style="font-size:20px">${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></body></html>`,
  );
}

// Best effort: the login tool also returns the URL so the user can open it manually.
export function openInBrowser(url: string): boolean {
  try {
    const [command, args]: [string, string[]] = process.platform === "win32"
      ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
    const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
    child.on("error", () => undefined);
    child.unref();
    return true;
  } catch {
    return false;
  }
}
