/** Bridge HTTP API v1 — stable contract for external clients (web, mobile, scripts). */

export const API_SPEC = "/api/v1" as const;

export interface HealthResponse {
  ok: true;
  version: string;
  build: string;
  uptimeMs: number;
}

export interface VersionResponse {
  version: string;
  build: string;
  components: Record<string, string>;
  updateAvailable: boolean;
  updateMessage: string;
}

export interface PromptRequest {
  prompt: string;
  mode?: "agent" | "plan" | "ask";
  submit?: boolean;
  print?: boolean;
}

export interface PromptResponse {
  ok: boolean;
  jobId: string;
  output?: string;
  error?: string;
}

export interface InvestigateRequest {
  topic: string;
  categories?: string[];
}

export interface InvestigateResponse {
  ok: boolean;
  plan: unknown;
  agentPrompt: string;
}

export interface RouteRequest {
  intent: string;
  query?: string;
}

export interface IntegrationsResponse {
  integrations: Array<{
    id: string;
    name: string;
    configured: boolean;
    categories: string[];
  }>;
}

export interface MaxAccessResponse {
  enabled: boolean;
}

export interface MaxAccessRequest {
  enabled: boolean;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}

export type WsEvent =
  | { type: "connected"; version: string }
  | { type: "job.started"; jobId: string; action: string }
  | { type: "job.done"; jobId: string; ok: boolean }
  | { type: "update.available"; from: string; to: string }
  | { type: "log"; message: string }
  | import("./cursor-contract").CursorWsEvent;

export const API_ROUTES = {
  health: `${API_SPEC}/health`,
  version: `${API_SPEC}/version`,
  integrations: `${API_SPEC}/integrations`,
  prompt: `${API_SPEC}/prompt`,
  investigate: `${API_SPEC}/investigate`,
  route: `${API_SPEC}/route`,
  stop: `${API_SPEC}/stop`,
  maxAccess: `${API_SPEC}/max-access`,
  events: `${API_SPEC}/events`,
} as const;
