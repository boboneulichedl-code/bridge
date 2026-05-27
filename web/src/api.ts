import type {
  HealthResponse,
  IntegrationsResponse,
  MaxAccessResponse,
  VersionResponse,
  WsEvent,
} from "../../shared/src/api-contract";
import type { StudioClientsResponse, StudioMaxAccessResponse } from "../../shared/src/studio-contract";

const API = "/api/v1";
const STUDIO = "/api/v1/studio";

function getToken(): string {
  return localStorage.getItem("bridge_token") || "";
}

async function api<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const bridgeApi = {
  health: () => api<HealthResponse>(API, "/health"),
  version: () => api<VersionResponse>(API, "/version"),
  integrations: () => api<IntegrationsResponse>(API, "/integrations"),
  maxAccess: () => api<MaxAccessResponse>(API, "/max-access"),
  setMaxAccess: (enabled: boolean) =>
    api<MaxAccessResponse>(API, "/max-access", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  prompt: (prompt: string, mode = "agent") =>
    api<{
      ok: boolean;
      jobId: string;
      output?: string;
      via?: string;
      message?: string;
      dispatched?: boolean;
    }>(API, "/prompt", {
      method: "POST",
      body: JSON.stringify({ prompt, mode, print: true }),
    }),
  investigate: (topic: string) =>
    api<{ ok: boolean; jobId: string; via?: string }>(API, "/investigate", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
  updateApply: () =>
    api<{ ok: boolean; message: string }>(API, "/update/apply", { method: "POST" }),
  studioHealth: () =>
    api<{ ok: boolean; clients: number; queuedJobs: number }>(STUDIO, "/health"),
  studioClients: () => api<StudioClientsResponse>(STUDIO, "/clients"),
  studioMaxAccess: () => api<StudioMaxAccessResponse>(STUDIO, "/max-access"),
  setStudioMaxAccess: (enabled: boolean, autonomous = true) =>
    api<StudioMaxAccessResponse>(STUDIO, "/max-access", {
      method: "POST",
      body: JSON.stringify({ enabled, autonomous }),
    }),
  connectEvents(onEvent: (e: WsEvent) => void): WebSocket {
    const token = getToken();
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${location.host}${API}/events${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const ws = new WebSocket(url);
    ws.onmessage = (m) => {
      try {
        onEvent(JSON.parse(m.data) as WsEvent);
      } catch {
        /* ignore */
      }
    };
    return ws;
  },
};
