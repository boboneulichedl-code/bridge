import { spawn } from "node:child_process";
import * as path from "node:path";
import type { AiAction, GuiNode, GuiSnapshot, WindowInfo } from "./types";

function scriptsDir(): string {
  const inResources = path.join(process.resourcesPath, "scripts");
  if (require("fs").existsSync(inResources)) return inResources;
  return path.join(__dirname, "..", "scripts");
}

export function runPowerShell(script: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ps = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...args],
      { windowsHide: true }
    );
    let out = "";
    let err = "";
    ps.stdout.on("data", (d) => (out += d.toString()));
    ps.stderr.on("data", (d) => (err += d.toString()));
    ps.on("close", (code) => {
      if (code !== 0) reject(new Error(err || out || `PS exit ${code}`));
      else resolve(out.trim());
    });
  });
}

export async function captureForeground(fingerprintOnly = false): Promise<{
  window: WindowInfo;
  fingerprint: string;
  nodes: GuiNode[];
}> {
  const script = path.join(scriptsDir(), "capture-gui.ps1");
  const args = fingerprintOnly ? ["-FingerprintOnly"] : [];
  const raw = await runPowerShell(script, args);
  const data = JSON.parse(raw) as {
    window: WindowInfo;
    fingerprint: string;
    nodes: GuiNode[];
  };
  return data;
}

export async function controlElement(
  processId: number,
  action: AiAction
): Promise<{ ok: boolean; error?: string }> {
  const script = path.join(scriptsDir(), "control-gui.ps1");
  const args = [
    "-ProcessId",
    String(processId),
    "-Action",
    action.action === "type" ? "type" : action.action === "focus" ? "focus" : "click",
  ];
  if (action.automationId) args.push("-AutomationId", action.automationId);
  if (action.target) args.push("-Name", action.target);
  if (action.text) args.push("-Text", action.text);
  const raw = await runPowerShell(script, args);
  return JSON.parse(raw) as { ok: boolean; error?: string };
}

export async function askBridgeAi(
  prompt: string,
  snapshot: GuiSnapshot,
  token: string,
  baseUrl: string
): Promise<AiAction[]> {
  const context = snapshot.nodes
    .slice(0, 40)
    .map((n) => flattenNodes(n))
    .flat()
    .slice(0, 80)
    .map((n) => `- ${n.controlType} "${n.name}" id=${n.automationId}`)
    .join("\n");

  const fullPrompt = `${prompt}

Ziel-Fenster: ${snapshot.windowTitle} (${snapshot.processName})
Verfügbare UI-Elemente:
${context}

Antworte NUR als JSON-Array von Aktionen:
[{"action":"click|type|focus","target":"Name","automationId":"...","text":"..."}]`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/api/v1/prompt`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: fullPrompt, mode: "agent", print: true }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const body = (await res.json()) as { output?: string };
  const text = body.output ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]) as AiAction[];
}

function flattenNodes(n: GuiNode): GuiNode[] {
  return [n, ...n.children.flatMap(flattenNodes)];
}
