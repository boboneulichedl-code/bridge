import * as http from "node:http";
import * as vscode from "vscode";
import { DEFAULT_IPC_PORT, IPC_HOST } from "./ide/ipc/constants";
import { handleIpcRequest } from "./ide/ipc/handler";
import {
  removeIdeControlHandshake,
  writeIdeControlHandshake,
} from "./ide/ipc/handshake";
import { ensureIpcToken, tokenMatches } from "./ide/ipc/tokenStore";

let server: http.Server | undefined;

function readJsonBody(
  req: http.IncomingMessage
): Promise<{ body: Record<string, unknown>; length: number }> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve({
          body: data ? (JSON.parse(data) as Record<string, unknown>) : {},
          length: Buffer.byteLength(data),
        });
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function startIdeControlHost(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration("bridge");
  const enabled = config.get<boolean>("ideControl.enabled", true);
  if (!enabled) return;

  ensureIpcToken();
  const port = config.get<number>("ideControl.port", DEFAULT_IPC_PORT);
  const extensionVersion = context.extension.packageJSON.version ?? "0.0.0";

  server = http.createServer(async (req, res) => {
    try {
      let body: Record<string, unknown> = {};
      let bodyLength = 0;
      if (req.method === "POST") {
        const parsed = await readJsonBody(req);
        body = parsed.body;
        bodyLength = parsed.length;
      }

      const response = await handleIpcRequest({
        method: req.method ?? "GET",
        pathname: req.url ?? "/",
        headers: req.headers as Record<string, string | string[] | undefined>,
        body,
        bodyLength,
        ctx: {
          extensionVersion,
          cursorVersion: vscode.version,
          port,
          pid: process.pid,
          tokenMatches,
        },
      });

      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response.body));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Internal IPC error" }));
    }
  });

  server.listen(port, IPC_HOST, () => {
    writeIdeControlHandshake({
      port,
      pid: process.pid,
      extensionVersion,
    });
    const channel = vscode.window.createOutputChannel("Bridge IDE Control");
    context.subscriptions.push(channel);
    channel.appendLine(`IDE Control Host (Step 5) → http://${IPC_HOST}:${port}`);
    channel.appendLine(
      "Endpoints: /health, /capabilities, /actions/execute, /snapshots/restore"
    );
  });

  context.subscriptions.push({ dispose: () => stopIdeControlHost() });
}

export function stopIdeControlHost(): void {
  if (server) {
    server.close();
    server = undefined;
  }
  removeIdeControlHandshake();
}

export function isIdeControlHostRunning(): boolean {
  return server !== undefined;
}
