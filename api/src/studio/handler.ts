import type { IncomingMessage, ServerResponse } from "node:http";
import {
  STUDIO_API_SPEC,
  type StudioJobCompleteRequest,
  type StudioMaxAccessRequest,
  type StudioPromptRequest,
  type StudioRegisterRequest,
  buildInvestigationPlan,
} from "@bridge/shared";
import {
  completeStudioJob,
  createStudioJob,
  getStudioJob,
  getStudioMaxAccess,
  listStudioClients,
  queuedJobCount,
  registerStudioClient,
  setStudioMaxAccess,
} from "./registry";

export type JsonResponder = (res: ServerResponse, status: number, body: unknown) => void;
export type BodyReader = (req: IncomingMessage) => Promise<string>;

export async function handleStudioApi(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  json: JsonResponder,
  readBody: BodyReader,
  version: string,
  build: string
): Promise<boolean> {
  if (!pathname.startsWith(STUDIO_API_SPEC)) return false;

  if (pathname === `${STUDIO_API_SPEC}/health` && req.method === "GET") {
    const ma = getStudioMaxAccess();
    json(res, 200, {
      ok: true,
      platform: "studio",
      version,
      build,
      maxAccess: ma.enabled,
      autonomous: ma.autonomous,
      clients: listStudioClients().length,
      queuedJobs: queuedJobCount(),
    });
    return true;
  }

  if (pathname === `${STUDIO_API_SPEC}/register` && req.method === "POST") {
    const raw = await readBody(req);
    const body = JSON.parse(raw || "{}") as StudioRegisterRequest;
    if (!body.clientId) {
      json(res, 400, { ok: false, error: "clientId required" });
      return true;
    }
    const info = registerStudioClient(body, () => {});
    json(res, 200, {
      ok: true,
      clientId: info.id,
      maxAccess: info.maxAccess,
      autonomous: info.autonomous,
    });
    return true;
  }

  if (pathname === `${STUDIO_API_SPEC}/clients` && req.method === "GET") {
    json(res, 200, {
      clients: listStudioClients(),
      queuedJobs: queuedJobCount(),
    });
    return true;
  }

  if (pathname === `${STUDIO_API_SPEC}/max-access`) {
    if (req.method === "GET") {
      const ma = getStudioMaxAccess();
      json(res, 200, { enabled: ma.enabled, autonomous: ma.autonomous });
      return true;
    }
    if (req.method === "POST") {
      const raw = await readBody(req);
      const body = JSON.parse(raw || "{}") as StudioMaxAccessRequest;
      const current = getStudioMaxAccess();
      setStudioMaxAccess(body.enabled ?? current.enabled, body.autonomous ?? current.autonomous);
      const ma = getStudioMaxAccess();
      json(res, 200, { enabled: ma.enabled, autonomous: ma.autonomous });
      return true;
    }
  }

  if (pathname === `${STUDIO_API_SPEC}/prompt` && req.method === "POST") {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as StudioPromptRequest;
    const clients = listStudioClients();
    const job = createStudioJob(
      "prompt",
      {
        prompt: body.prompt,
        mode: body.mode,
        autoSubmit: body.autoSubmit ?? true,
      },
      body.clientId
    );
    json(res, 200, {
      ok: true,
      jobId: job.id,
      dispatched: job.status === "running",
      message:
        job.status === "running"
          ? "An Android Studio gesendet"
          : clients.length
            ? "In Warteschlange"
            : "Kein Studio-Client verbunden — Job wartet",
    });
    return true;
  }

  if (pathname === `${STUDIO_API_SPEC}/investigate` && req.method === "POST") {
    const raw = await readBody(req);
    const { topic, categories, clientId } = JSON.parse(raw) as {
      topic: string;
      categories?: string[];
      clientId?: string;
    };
    const plan = await buildInvestigationPlan(topic, categories);
    const job = createStudioJob(
      "investigate",
      { prompt: plan.agentPrompt, topic, categories, autoSubmit: true },
      clientId
    );
    json(res, 200, {
      ok: true,
      jobId: job.id,
      plan,
      agentPrompt: plan.agentPrompt,
      dispatched: job.status === "running",
    });
    return true;
  }

  if (pathname.match(new RegExp(`^${STUDIO_API_SPEC}/jobs/[^/]+$`)) && req.method === "GET") {
    const id = pathname.split("/").pop()!;
    const job = getStudioJob(id);
    if (!job) {
      json(res, 404, { ok: false, error: "Job not found" });
      return true;
    }
    json(res, 200, job);
    return true;
  }

  if (pathname.match(new RegExp(`^${STUDIO_API_SPEC}/jobs/[^/]+/complete$`)) && req.method === "POST") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 2]!;
    const raw = await readBody(req);
    const body = JSON.parse(raw || "{}") as StudioJobCompleteRequest;
    const job = completeStudioJob(id, body.ok, body.output, body.error);
    if (!job) {
      json(res, 404, { ok: false, error: "Job not found" });
      return true;
    }
    json(res, 200, { ok: true, job });
    return true;
  }

  json(res, 404, { ok: false, error: "Studio route not found" });
  return true;
}
