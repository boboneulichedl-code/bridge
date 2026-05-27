import { spawn } from "node:child_process";
import * as crypto from "node:crypto";
import {
  appendMaxAccessAgentFlags,
  applyUpdate,
  buildInvestigationPlan,
  checkForUpdate,
  findBridgeRoot,
  isMaxAccessEnabled,
  listIntegrationStatus,
  loadVersionManifest,
  routeIntent,
  enableMaxAccess,
  disableMaxAccess,
  API_SPEC,
  type WsEvent,
} from "@bridge/shared";

export interface JobRecord {
  id: string;
  action: string;
  status: "running" | "done" | "error";
  output?: string;
  error?: string;
}

const jobs = new Map<string, JobRecord>();

export function createJob(action: string): JobRecord {
  const job: JobRecord = {
    id: crypto.randomUUID(),
    action,
    status: "running",
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): JobRecord | undefined {
  return jobs.get(id);
}

function runAgent(args: string[], cwd: string): Promise<{ stdout: string; code: number }> {
  const bin = process.env.BRIDGE_AGENT_BIN || (process.platform === "win32" ? "agent.exe" : "agent");
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd,
      shell: process.platform === "win32",
      env: process.env,
    });
    let stdout = "";
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.on("error", () => resolve({ stdout, code: 1 }));
    child.on("close", (code) => resolve({ stdout, code: code ?? 1 }));
  });
}

export async function executePrompt(
  prompt: string,
  opts: { mode?: string; print?: boolean },
  cwd: string
): Promise<{ ok: boolean; output: string }> {
  const maxAccess = isMaxAccessEnabled(cwd);
  let args = opts.print ? ["-p", "--output-format", "text"] : [];
  if (opts.mode) args.push(`--mode=${opts.mode}`);
  if (maxAccess || opts.print) args.push("--force", "--trust", "--approve-mcps");
  args = appendMaxAccessAgentFlags(args, maxAccess);
  args.push(prompt);
  const result = await runAgent(args, cwd);
  return { ok: result.code === 0, output: result.stdout };
}

export type EventEmitter = (event: WsEvent) => void;

export async function runUpdateCheck(emit?: EventEmitter): Promise<ReturnType<typeof checkForUpdate>> {
  const result = checkForUpdate();
  if (result.updateAvailable && emit) {
    emit({
      type: "update.available",
      from: result.installed?.version ?? "none",
      to: result.current.version,
    });
  }
  return result;
}

export async function runApplyUpdate(emit?: EventEmitter): Promise<{ ok: boolean; message: string }> {
  const result = await applyUpdate();
  if (emit && result.ok) {
    emit({ type: "log", message: result.message });
  }
  return result;
}

export {
  findBridgeRoot,
  loadVersionManifest,
  listIntegrationStatus,
  buildInvestigationPlan,
  routeIntent,
  isMaxAccessEnabled,
  enableMaxAccess,
  disableMaxAccess,
  checkForUpdate,
  API_SPEC,
};
