import type {
  StudioClientInfo,
  StudioJob,
  StudioJobPayload,
  StudioJobType,
  StudioRegisterRequest,
  StudioWsServerEvent,
} from "@bridge/shared";

type StudioWsSend = (event: StudioWsServerEvent) => void;

interface StudioClientSession extends StudioClientInfo {
  send: StudioWsSend;
}

const clients = new Map<string, StudioClientSession>();
const jobs = new Map<string, StudioJob>();
const jobQueue: string[] = [];

let studioMaxAccess = true;
let studioAutonomous = true;

export function getStudioMaxAccess(): { enabled: boolean; autonomous: boolean } {
  return { enabled: studioMaxAccess, autonomous: studioAutonomous };
}

export function setStudioMaxAccess(enabled: boolean, autonomous?: boolean): void {
  studioMaxAccess = enabled;
  if (autonomous !== undefined) studioAutonomous = autonomous;
  broadcastToStudio({
    type: "max-access.changed",
    enabled: studioMaxAccess,
    autonomous: studioAutonomous,
  });
}

const noop: StudioWsSend = () => {};

export function registerStudioClient(
  req: StudioRegisterRequest,
  send: StudioWsSend = noop
): StudioClientInfo {
  const now = new Date().toISOString();
  const existing = clients.get(req.clientId);
  const maxAccess = req.maxAccess ?? existing?.maxAccess ?? studioMaxAccess;
  const autonomous = req.autonomous ?? existing?.autonomous ?? studioAutonomous;
  const sendFn = send !== noop ? send : (existing?.send ?? noop);
  const info: StudioClientSession = {
    id: req.clientId,
    name: req.name || existing?.name || "Android Studio",
    projectPath: req.projectPath ?? existing?.projectPath,
    maxAccess,
    autonomous,
    connectedAt: existing?.connectedAt ?? now,
    lastSeen: now,
    version: req.version ?? existing?.version,
    send: sendFn,
  };
  clients.set(req.clientId, info);
  drainQueueForClient(req.clientId);
  return toPublicClient(info);
}

export function unregisterStudioClient(clientId: string): void {
  clients.delete(clientId);
}

export function touchStudioClient(clientId: string): void {
  const c = clients.get(clientId);
  if (c) c.lastSeen = new Date().toISOString();
}

export function listStudioClients(): StudioClientInfo[] {
  return [...clients.values()].map(toPublicClient);
}

export function getStudioJob(id: string): StudioJob | undefined {
  return jobs.get(id);
}

export function createStudioJob(
  type: StudioJobType,
  payload: StudioJobPayload,
  clientId?: string
): StudioJob {
  const job: StudioJob = {
    id: crypto.randomUUID(),
    type,
    payload: {
      ...payload,
      autoSubmit: payload.autoSubmit ?? studioAutonomous,
    },
    clientId,
    status: "queued",
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  jobQueue.push(job.id);
  dispatchJob(job);
  return job;
}

function dispatchJob(job: StudioJob): void {
  const targetId = job.clientId;
  const target = targetId ? clients.get(targetId) : pickDefaultClient();
  if (!target) return;

  job.status = "running";
  job.clientId = target.id;
  target.send({ type: "job.dispatch", job });
  const idx = jobQueue.indexOf(job.id);
  if (idx >= 0) jobQueue.splice(idx, 1);
}

function pickDefaultClient(): StudioClientSession | undefined {
  const online = [...clients.values()];
  if (!online.length) return undefined;
  return online.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))[0];
}

function drainQueueForClient(clientId: string): void {
  for (const id of [...jobQueue]) {
    const job = jobs.get(id);
    if (!job || job.status !== "queued") continue;
    if (job.clientId && job.clientId !== clientId) continue;
    dispatchJob(job);
  }
}

export function completeStudioJob(
  jobId: string,
  ok: boolean,
  output?: string,
  error?: string
): StudioJob | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;
  job.status = ok ? "done" : "error";
  job.output = output;
  job.error = error;
  job.completedAt = new Date().toISOString();
  const idx = jobQueue.indexOf(jobId);
  if (idx >= 0) jobQueue.splice(idx, 1);
  return job;
}

export function queuedJobCount(): number {
  return jobQueue.length;
}

function toPublicClient(c: StudioClientSession): StudioClientInfo {
  return {
    id: c.id,
    name: c.name,
    projectPath: c.projectPath,
    maxAccess: c.maxAccess,
    autonomous: c.autonomous,
    connectedAt: c.connectedAt,
    lastSeen: c.lastSeen,
    version: c.version,
  };
}

function broadcastToStudio(event: StudioWsServerEvent): void {
  for (const c of clients.values()) {
    try {
      c.send(event);
    } catch {
      /* ignore */
    }
  }
}

export function broadcastStudioJobDone(jobId: string, ok: boolean): void {
  /* web UI listens on main WS — handled in server */
}
