import * as fs from "node:fs";
import * as path from "node:path";
import { getCursorMcpConfigPath } from "./mcp-config";

export const MAX_ACCESS_MARKER = ".cursor/bridge-max-access";
export const MAX_ACCESS_ENV = "BRIDGE_MAX_ACCESS";

export function isMaxAccessEnabled(cwd = process.cwd()): boolean {
  if (process.env[MAX_ACCESS_ENV] === "1" || process.env[MAX_ACCESS_ENV] === "true") {
    return true;
  }
  return fs.existsSync(path.join(cwd, MAX_ACCESS_MARKER));
}

export function getMaxAccessMarkerPath(cwd = process.cwd()): string {
  return path.join(cwd, MAX_ACCESS_MARKER);
}

export function enableMaxAccess(cwd = process.cwd()): void {
  const marker = getMaxAccessMarkerPath(cwd);
  fs.mkdirSync(path.dirname(marker), { recursive: true });
  fs.writeFileSync(
    marker,
    JSON.stringify({ enabled: true, at: new Date().toISOString() }, null, 2)
  );
  process.env[MAX_ACCESS_ENV] = "1";
}

export function disableMaxAccess(cwd = process.cwd()): void {
  const marker = getMaxAccessMarkerPath(cwd);
  if (fs.existsSync(marker)) {
    fs.unlinkSync(marker);
  }
  delete process.env[MAX_ACCESS_ENV];
}

export function patchMcpConfigForMaxAccess(bridgeRoot: string, enable: boolean): void {
  const configPath = getCursorMcpConfigPath();
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  const servers = (config.mcpServers as Record<string, Record<string, unknown>>) ?? {};
  const entry = servers["agent-bridge"] ?? {
    command: "node",
    args: [path.join(bridgeRoot, "mcp-server", "dist", "index.js")],
  };
  entry.env = {
    ...(entry.env as Record<string, string> | undefined),
    BRIDGE_ROOT: bridgeRoot,
    BRIDGE_MAX_ACCESS: enable ? "1" : "0",
  };
  servers["agent-bridge"] = entry;
  config.mcpServers = servers;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export const MAX_ACCESS_AGENT_FLAGS = ["--force", "--trust", "--approve-mcps"] as const;

export function appendMaxAccessAgentFlags(args: string[], maxAccess: boolean): string[] {
  if (!maxAccess) return args;
  const out = [...args];
  for (const flag of MAX_ACCESS_AGENT_FLAGS) {
    if (!out.includes(flag)) out.push(flag);
  }
  return out;
}

export const HOOKS_JSON = {
  version: 1,
  hooks: {
    beforeShellExecution: [{ command: "node .cursor/hooks/max-access-shell.js" }],
    beforeMCPExecution: [{ command: "node .cursor/hooks/max-access-mcp.js" }],
    preToolUse: [{ command: "node .cursor/hooks/max-access-tool.js", matcher: "Shell|Write|Task" }],
  },
} as const;
