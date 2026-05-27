/** Bridge Studio API — Android Studio plugin protocol (separate from Cursor /api/v1). */

export const STUDIO_API_SPEC = "/api/v1/studio" as const;

export type StudioJobType = "prompt" | "investigate" | "shell" | "adb" | "gradle";

export interface StudioClientInfo {
  id: string;
  name: string;
  projectPath?: string;
  maxAccess: boolean;
  autonomous: boolean;
  connectedAt: string;
  lastSeen: string;
  version?: string;
}

export interface StudioJobPayload {
  prompt?: string;
  mode?: "agent" | "plan" | "ask";
  topic?: string;
  categories?: string[];
  command?: string;
  autoSubmit?: boolean;
}

export interface StudioJob {
  id: string;
  type: StudioJobType;
  payload: StudioJobPayload;
  clientId?: string;
  status: "queued" | "running" | "done" | "error";
  output?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StudioRegisterRequest {
  clientId: string;
  name?: string;
  projectPath?: string;
  maxAccess?: boolean;
  autonomous?: boolean;
  version?: string;
}

export interface StudioRegisterResponse {
  ok: true;
  clientId: string;
  maxAccess: boolean;
  autonomous: boolean;
}

export interface StudioClientsResponse {
  clients: StudioClientInfo[];
  queuedJobs: number;
}

export interface StudioPromptRequest {
  prompt: string;
  mode?: "agent" | "plan" | "ask";
  clientId?: string;
  autoSubmit?: boolean;
}

export interface StudioPromptResponse {
  ok: boolean;
  jobId: string;
  dispatched: boolean;
  message?: string;
}

export interface StudioJobCompleteRequest {
  ok: boolean;
  output?: string;
  error?: string;
}

export interface StudioMaxAccessResponse {
  enabled: boolean;
  autonomous: boolean;
}

export interface StudioMaxAccessRequest {
  enabled?: boolean;
  autonomous?: boolean;
  clientId?: string;
}

export type StudioWsServerEvent =
  | { type: "connected"; clientId: string; version: string }
  | { type: "job.dispatch"; job: StudioJob }
  | { type: "max-access.changed"; enabled: boolean; autonomous: boolean }
  | { type: "ping" };

export type StudioWsClientEvent =
  | { type: "register"; client: StudioRegisterRequest }
  | { type: "heartbeat"; clientId: string }
  | { type: "job.complete"; jobId: string; ok: boolean; output?: string; error?: string }
  | { type: "log"; message: string }
  | { type: "pong" };

export const STUDIO_API_ROUTES = {
  health: `${STUDIO_API_SPEC}/health`,
  register: `${STUDIO_API_SPEC}/register`,
  clients: `${STUDIO_API_SPEC}/clients`,
  prompt: `${STUDIO_API_SPEC}/prompt`,
  investigate: `${STUDIO_API_SPEC}/investigate`,
  maxAccess: `${STUDIO_API_SPEC}/max-access`,
  events: `${STUDIO_API_SPEC}/events`,
  jobs: `${STUDIO_API_SPEC}/jobs`,
} as const;
