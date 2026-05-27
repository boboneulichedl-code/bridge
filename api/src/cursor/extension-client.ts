import * as fs from "node:fs";
import * as http from "node:http";
import {
  DEFAULT_IPC_PORT,
  IPC_HOST,
  IPC_TIMEOUT_MS,
  readIpcToken,
} from "@bridge/cursor-adapter";
import type { HandshakeFile } from "@bridge/cursor-adapter";
import type {
  CursorActionId,
  IpcExecuteRequest,
  IpcExecuteResponse,
  IpcHealthResponse,
  IpcRestoreRequest,
  IpcRestoreResponse,
} from "@bridge/shared";
import type { SnapshotRecord } from "@bridge/cursor-adapter";
import { getHandshakePath } from "@bridge/shared";

const HEALTH_TTL_MS = 2000;
const IPC_RETRY_ATTEMPTS = 2;
const IPC_RETRY_DELAY_MS = 150;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 30_000;

let healthCache: { at: number; data: IpcHealthResponse } | null = null;
let capabilitiesCache: { at: number; data: { methods: readonly string[] } } | null = null;
let circuitFailures = 0;
let circuitOpenedAt = 0;

function readHandshake(): HandshakeFile | null {
  const p = getHandshakePath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as HandshakeFile;
  } catch {
    return null;
  }
}

function resolvePort(): number {
  const hs = readHandshake();
  if (hs?.port) return hs.port;
  return Number(process.env.BRIDGE_IPC_PORT || DEFAULT_IPC_PORT);
}

function isCircuitOpen(): boolean {
  if (circuitFailures < CIRCUIT_THRESHOLD) return false;
  if (Date.now() - circuitOpenedAt >= CIRCUIT_COOLDOWN_MS) {
    circuitFailures = 0;
    circuitOpenedAt = 0;
    return false;
  }
  return true;
}

function recordFailure(): void {
  circuitFailures++;
  if (circuitFailures >= CIRCUIT_THRESHOLD) {
    circuitOpenedAt = Date.now();
  }
}

function recordSuccess(): void {
  circuitFailures = 0;
  circuitOpenedAt = 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ipcRequestOnce<T>(method: string, pathname: string, body?: unknown): Promise<T> {
  const token = readIpcToken();
  const port = resolvePort();

  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        host: IPC_HOST,
        port,
        path: pathname,
        method,
        family: 4,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Bridge-Ipc-Token": token } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        timeout: IPC_TIMEOUT_MS,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c.toString();
        });
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode && res.statusCode >= 400) {
              recordFailure();
              reject(new Error(parsed.error || `IPC ${res.statusCode}`));
              return;
            }
            recordSuccess();
            resolve(parsed as T);
          } catch (e) {
            recordFailure();
            reject(e);
          }
        });
      }
    );
    req.on("error", (err) => {
      recordFailure();
      reject(err);
    });
    req.on("timeout", () => {
      req.destroy();
      recordFailure();
      reject(new Error("IPC timeout"));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function ipcRequest<T>(
  method: string,
  pathname: string,
  body?: unknown
): Promise<T> {
  if (isCircuitOpen()) {
    throw new Error("Extension IPC circuit open");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < IPC_RETRY_ATTEMPTS; attempt++) {
    try {
      return await ipcRequestOnce<T>(method, pathname, body);
    } catch (err) {
      lastError = err;
      if (attempt < IPC_RETRY_ATTEMPTS - 1 && !isCircuitOpen()) {
        await sleep(IPC_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function isExtensionReachable(): Promise<boolean> {
  if (isCircuitOpen()) return false;
  try {
    await getExtensionHealth();
    return true;
  } catch {
    return false;
  }
}

export async function getExtensionHealth(): Promise<IpcHealthResponse> {
  const now = Date.now();
  if (healthCache && now - healthCache.at < HEALTH_TTL_MS) {
    return healthCache.data;
  }
  const data = await ipcRequest<IpcHealthResponse>("GET", "/health");
  healthCache = { at: now, data };
  return data;
}

export async function getExtensionCapabilities(): Promise<{ methods: readonly string[] }> {
  const now = Date.now();
  if (capabilitiesCache && now - capabilitiesCache.at < HEALTH_TTL_MS) {
    return capabilitiesCache.data;
  }
  const data = await ipcRequest<{ methods: readonly string[] }>("GET", "/capabilities");
  capabilitiesCache = { at: now, data };
  return data;
}

export async function executeViaExtension(
  actionId: CursorActionId,
  params: Record<string, unknown>,
  requestId: string
): Promise<IpcExecuteResponse> {
  const body: IpcExecuteRequest = { actionId, params, requestId };
  return ipcRequest<IpcExecuteResponse>("POST", "/actions/execute", body);
}

export async function restoreViaExtension(
  snapshot: SnapshotRecord,
  requestId: string
): Promise<IpcRestoreResponse> {
  const body: IpcRestoreRequest = {
    actionId: snapshot.actionId,
    payload: snapshot.payload,
    requestId,
  };
  return ipcRequest<IpcRestoreResponse>("POST", "/snapshots/restore", body);
}

export function createExtensionClientAdapter() {
  return {
    async isReachable() {
      return isExtensionReachable();
    },
    async getHealth() {
      const h = await getExtensionHealth();
      return { cursorVersion: h.cursorVersion };
    },
    async execute(
      actionId: CursorActionId,
      params: Record<string, unknown>,
      requestId: string
    ) {
      return executeViaExtension(actionId, params, requestId);
    },
  };
}

/** Test helper — reset caches and circuit breaker */
export function resetExtensionClientForTests(): void {
  healthCache = null;
  capabilitiesCache = null;
  circuitFailures = 0;
  circuitOpenedAt = 0;
}

export { IPC_HOST, IPC_TIMEOUT_MS, IPC_RETRY_ATTEMPTS, CIRCUIT_THRESHOLD };
