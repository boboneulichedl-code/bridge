#!/usr/bin/env node
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { WebSocketServer } from "ws";
import {
  API_SPEC,
  type HealthResponse,
  type IntegrationsResponse,
  type MaxAccessRequest,
  type MaxAccessResponse,
  type PromptRequest,
  type VersionResponse,
  type WsEvent,
} from "@bridge/shared";
import {
  STUDIO_API_SPEC,
  type StudioWsClientEvent,
  loadVersionManifest,
} from "@bridge/shared";
import { handleStudioApi } from "./studio/handler";
import { handleCursorApi } from "./cursor/handler";
import {
  CURSOR_API_SPEC,
} from "@bridge/shared";
import {
  completeStudioJob,
  createStudioJob,
  listStudioClients,
  registerStudioClient,
  touchStudioClient,
  unregisterStudioClient,
} from "./studio/registry";
import {
  API_SPEC as SPEC,
  buildInvestigationPlan,
  checkForUpdate,
  createJob,
  disableMaxAccess,
  enableMaxAccess,
  executePrompt,
  findBridgeRoot,
  getJob,
  isMaxAccessEnabled,
  listIntegrationStatus,
  routeIntent,
  runApplyUpdate,
} from "./services";

const PORT = Number(process.env.BRIDGE_API_PORT || 3847);
const HOST = process.env.BRIDGE_API_HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const TOKEN = process.env.BRIDGE_API_TOKEN || "";
const startedAt = Date.now();

const bridgeRoot = findBridgeRoot();
const webDist = path.join(bridgeRoot, "web", "dist");

const wsClients = new Set<(e: WsEvent) => void>();

function broadcast(event: WsEvent): void {
  for (const send of wsClients) {
    try {
      send(event);
    } catch {
      /* ignore */
    }
  }
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function unauthorized(res: http.ServerResponse): void {
  json(res, 401, { ok: false, error: "Unauthorized" });
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function authOk(req: http.IncomingMessage): boolean {
  if (!TOKEN) return true;
  const h = req.headers.authorization || "";
  return h === `Bearer ${TOKEN}` || h === TOKEN;
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  if (req.method !== "GET") return false;
  const url = req.url?.split("?")[0] || "/";
  if (url.startsWith(API_SPEC) || url.startsWith(STUDIO_API_SPEC)) return false;

  let filePath = url === "/" ? "/index.html" : url;
  const full = path.join(webDist, filePath);
  if (!full.startsWith(webDist)) {
    json(res, 403, { ok: false, error: "Forbidden" });
    return true;
  }
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    const index = path.join(webDist, "index.html");
    if (fs.existsSync(index)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(index).pipe(res);
      return true;
    }
    return false;
  }
  const ext = path.extname(full);
  const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
  };
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(full).pipe(res);
  return true;
}

async function handleApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string
): Promise<void> {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }
  if (pathname !== `${SPEC}/health` && pathname !== `${STUDIO_API_SPEC}/health` && pathname !== `${CURSOR_API_SPEC}/health` && !authOk(req)) {
    unauthorized(res);
    return;
  }

  const manifest = loadVersionManifest(bridgeRoot);
  const update = checkForUpdate(process.cwd());

  const studioHandled = await handleStudioApi(
    req,
    res,
    pathname,
    json,
    readBody,
    manifest.version,
    manifest.build
  );
  if (studioHandled) return;

  const cursorHandled = await handleCursorApi(
    req,
    res,
    pathname,
    json,
    readBody,
    (e) => broadcast(e as WsEvent)
  );
  if (cursorHandled) return;

  if (pathname === `${SPEC}/health` && req.method === "GET") {
    const body: HealthResponse = {
      ok: true,
      version: manifest.version,
      build: manifest.build,
      uptimeMs: Date.now() - startedAt,
    };
    json(res, 200, body);
    return;
  }

  if (pathname === `${SPEC}/version` && req.method === "GET") {
    const body: VersionResponse = {
      version: manifest.version,
      build: manifest.build,
      components: manifest.components,
      updateAvailable: update.updateAvailable,
      updateMessage: update.message,
    };
    json(res, 200, body);
    return;
  }

  if (pathname === `${SPEC}/integrations` && req.method === "GET") {
    const body: IntegrationsResponse = {
      integrations: listIntegrationStatus().map((i) => ({
        id: i.id,
        name: i.name,
        configured: i.configured,
        categories: i.categories,
      })),
    };
    json(res, 200, body);
    return;
  }

  if (pathname === `${SPEC}/max-access`) {
    if (req.method === "GET") {
      const body: MaxAccessResponse = { enabled: isMaxAccessEnabled() };
      json(res, 200, body);
      return;
    }
    if (req.method === "POST") {
      const raw = await readBody(req);
      const body = JSON.parse(raw || "{}") as MaxAccessRequest;
      if (body.enabled) enableMaxAccess();
      else disableMaxAccess();
      json(res, 200, { enabled: isMaxAccessEnabled() });
      return;
    }
  }

  if (pathname === `${SPEC}/update/check` && req.method === "POST") {
    json(res, 200, checkForUpdate());
    return;
  }

  if (pathname === `${SPEC}/update/apply` && req.method === "POST") {
    const result = await runApplyUpdate(broadcast);
    json(res, result.ok ? 200 : 500, result);
    return;
  }

  if (pathname === `${SPEC}/prompt` && req.method === "POST") {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as PromptRequest;
    const useLocalAgent = process.env.BRIDGE_LOCAL_AGENT === "1";

    res.setHeader("Deprecation", "true");
    res.setHeader("Link", `<${CURSOR_API_SPEC}/agent/prompt>; rel="successor-version"`);

    if (!useLocalAgent) {
      const job = createStudioJob("prompt", {
        prompt: body.prompt,
        mode: body.mode,
        autoSubmit: true,
      });
      broadcast({ type: "job.started", jobId: job.id, action: "prompt" });
      json(res, 200, {
        ok: true,
        jobId: job.id,
        dispatched: job.status === "running",
        via: "studio",
        deprecated: true,
        deprecatedMessage:
          "POST /api/v1/prompt is legacy orchestration. Use POST /api/v1/cursor/agent/prompt for P0 Cursor agent actions.",
        migrateTo: `${CURSOR_API_SPEC}/agent/prompt`,
        message: job.status === "running"
          ? "An Studio-Client gesendet"
          : "In Warteschlange — Studio-Client verbinden",
      });
      return;
    }

    const job = createJob("prompt");
    broadcast({ type: "job.started", jobId: job.id, action: "prompt" });
    const result = await executePrompt(body.prompt, {
      mode: body.mode,
      print: body.print ?? true,
    }, process.cwd());
    job.status = result.ok ? "done" : "error";
    job.output = result.output;
    broadcast({ type: "job.done", jobId: job.id, ok: result.ok });
    json(res, 200, {
      ok: result.ok,
      jobId: job.id,
      output: result.output,
      via: "local",
      deprecated: true,
      deprecatedMessage:
        "POST /api/v1/prompt is legacy orchestration. Use POST /api/v1/cursor/agent/prompt for P0 Cursor agent actions.",
      migrateTo: `${CURSOR_API_SPEC}/agent/prompt`,
    });
    return;
  }

  if (pathname === `${SPEC}/investigate` && req.method === "POST") {
    const raw = await readBody(req);
    const { topic, categories } = JSON.parse(raw) as { topic: string; categories?: string[] };
    const plan = await buildInvestigationPlan(topic, categories);
    const useLocalAgent = process.env.BRIDGE_LOCAL_AGENT === "1";

    if (!useLocalAgent) {
      const job = createStudioJob("investigate", {
        prompt: plan.agentPrompt,
        topic,
        categories,
        autoSubmit: true,
      });
      broadcast({ type: "job.started", jobId: job.id, action: "investigate" });
      json(res, 200, {
        ok: true,
        jobId: job.id,
        plan,
        agentPrompt: plan.agentPrompt,
        dispatched: job.status === "running",
        via: "studio",
      });
      return;
    }

    const job = createJob("investigate");
    broadcast({ type: "job.started", jobId: job.id, action: "investigate" });
    const exec = await executePrompt(plan.agentPrompt, { print: true }, process.cwd());
    job.status = exec.ok ? "done" : "error";
    job.output = exec.output;
    broadcast({ type: "job.done", jobId: job.id, ok: exec.ok });
    json(res, 200, { ok: exec.ok, plan, agentPrompt: plan.agentPrompt, jobId: job.id, via: "local" });
    return;
  }

  if (pathname === `${SPEC}/route` && req.method === "POST") {
    const raw = await readBody(req);
    const { intent, query } = JSON.parse(raw) as { intent: string; query?: string };
    json(res, 200, routeIntent(intent, query));
    return;
  }

  if (pathname === `${SPEC}/stop` && req.method === "POST") {
    json(res, 200, { ok: true, message: "Stop via IDE (Ctrl+Alt+.) empfohlen" });
    return;
  }

  if (pathname.startsWith(`${SPEC}/jobs/`) && req.method === "GET") {
    const id = pathname.split("/").pop()!;
    const job = getJob(id);
    if (!job) {
      json(res, 404, { ok: false, error: "Job not found" });
      return;
    }
    json(res, 200, job);
    return;
  }

  json(res, 404, { ok: false, error: "Not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = req.url?.split("?")[0] || "/";
    if (serveStatic(req, res)) return;
    if (pathname.startsWith(SPEC) || pathname.startsWith(CURSOR_API_SPEC)) {
      await handleApi(req, res, pathname);
      return;
    }
    json(res, 404, { ok: false, error: "Not found" });
  } catch (err) {
    json(res, 500, {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

const wss = new WebSocketServer({ noServer: true });
const studioWss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const pathname = req.url?.split("?")[0] || "";
  if (pathname === `${SPEC}/events`) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    return;
  }
  if (pathname === `${STUDIO_API_SPEC}/events`) {
    studioWss.handleUpgrade(req, socket, head, (ws) => studioWss.emit("connection", ws, req));
    return;
  }
  socket.destroy();
});

wss.on("connection", (ws, req) => {
  if (TOKEN) {
    const url = new URL(req.url || "", `http://${HOST}`);
    const t = url.searchParams.get("token") || req.headers.authorization?.replace("Bearer ", "");
    if (t !== TOKEN) {
      ws.close(4401, "Unauthorized");
      return;
    }
  }

  const manifest = loadVersionManifest(bridgeRoot);
  const send = (e: WsEvent) => ws.send(JSON.stringify(e));
  wsClients.add(send);
  send({ type: "connected", version: manifest.version });

  ws.on("close", () => wsClients.delete(send));
});

studioWss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${HOST}`);
  if (TOKEN) {
    const t = url.searchParams.get("token") || req.headers.authorization?.replace("Bearer ", "");
    if (t !== TOKEN) {
      ws.close(4401, "Unauthorized");
      return;
    }
  }

  const clientId = url.searchParams.get("clientId") || crypto.randomUUID();
  const manifest = loadVersionManifest(bridgeRoot);

  const send = (event: import("@bridge/shared").StudioWsServerEvent) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(event));
  };

  registerStudioClient(
    {
      clientId,
      name: url.searchParams.get("name") || "Android Studio",
      projectPath: url.searchParams.get("project") || undefined,
      maxAccess: url.searchParams.get("maxAccess") !== "0",
      autonomous: url.searchParams.get("autonomous") !== "0",
      version: url.searchParams.get("version") || undefined,
    },
    send
  );

  send({ type: "connected", clientId, version: manifest.version });
  broadcast({ type: "log", message: `Studio client connected: ${clientId}` });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(String(data)) as StudioWsClientEvent;
      if (msg.type === "heartbeat") {
        touchStudioClient(msg.clientId);
        send({ type: "ping" });
        return;
      }
      if (msg.type === "job.complete") {
        const job = completeStudioJob(msg.jobId, msg.ok, msg.output, msg.error);
        if (job) {
          broadcast({ type: "job.done", jobId: job.id, ok: msg.ok });
        }
        return;
      }
      if (msg.type === "log") {
        broadcast({ type: "log", message: `[studio] ${msg.message}` });
      }
    } catch {
      /* ignore malformed */
    }
  });

  ws.on("close", () => {
    unregisterStudioClient(clientId);
    broadcast({ type: "log", message: `Studio client disconnected: ${clientId}` });
  });
});

server.listen(PORT, HOST, () => {
  const manifest = loadVersionManifest(bridgeRoot);
  console.log(`Bridge API v${manifest.version} → http://${HOST}:${PORT}`);
  console.log(`  REST  ${SPEC}/*  (Cursor / Web)`);
  console.log(`  REST  ${CURSOR_API_SPEC}/*  (Cursor IDE Control)`);
  console.log(`  REST  ${STUDIO_API_SPEC}/*  (Android Studio)`);
  console.log(`  WS    ${SPEC}/events`);
  console.log(`  WS    ${STUDIO_API_SPEC}/events`);
  if (fs.existsSync(webDist)) {
    console.log(`  Web   http://${HOST}:${PORT}/`);
  }
  const update = checkForUpdate(process.cwd());
  if (update.updateAvailable) {
    console.log(`  ⚠ ${update.message}`);
    broadcast({
      type: "update.available",
      from: update.installed?.version ?? "none",
      to: update.current.version,
    });
  }
});
