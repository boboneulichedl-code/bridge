import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { INTEGRATIONS } from "./integrations";
import type { IntegrationDefinition, McpConfig } from "./types";

export function getCursorMcpConfigPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();
  return path.join(home, ".cursor", "mcp.json");
}

function getCursorPluginMcpKeys(): string[] {
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();
  const storage = path.join(home, "AppData", "Roaming", "Cursor", "User", "globalStorage", "anysphere.cursor-mcp");
  if (!fs.existsSync(storage)) return [];

  const keys = new Set<string>();
  for (const dir of ["mcp-oauth-attempts", "mcp-auth"]) {
    const p = path.join(storage, dir);
    if (!fs.existsSync(p)) continue;
    for (const file of fs.readdirSync(p)) {
      if (!file.endsWith(".json")) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(p, file), "utf8")) as {
          identifier?: string;
        };
        if (data.identifier) keys.add(data.identifier);
      } catch {
        /* ignore */
      }
    }
  }
  return [...keys];
}

export function loadMcpConfig(): McpConfig {
  const configPath = getCursorMcpConfigPath();
  if (!fs.existsSync(configPath)) {
    return { mcpServers: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as McpConfig;
  } catch {
    return { mcpServers: {} };
  }
}

function listKnownMcpKeys(): string[] {
  const config = loadMcpConfig();
  const keys = new Set(Object.keys(config.mcpServers ?? {}));
  for (const k of getCursorPluginMcpKeys()) keys.add(k);
  return [...keys];
}

function matchesMcpKey(known: string, expected: string): boolean {
  if (known === expected) return true;
  const a = known.toLowerCase();
  const b = expected.toLowerCase();
  return a.includes(b) || b.includes(a);
}

export function isIntegrationConfigured(integration: IntegrationDefinition): boolean {
  if (integration.builtin) {
    return true;
  }
  const keys = listKnownMcpKeys();
  return integration.mcpServerKeys.some((expected) =>
    keys.some((known) => matchesMcpKey(known, expected))
  );
}

export function listIntegrationStatus(): Array<{
  id: string;
  name: string;
  configured: boolean;
  authRequired: boolean;
  categories: string[];
  setupHint: string;
  toolCount: number;
}> {
  return INTEGRATIONS.map((i) => ({
    id: i.id,
    name: i.name,
    configured: isIntegrationConfigured(i),
    authRequired: i.authRequired,
    categories: i.categories,
    setupHint: i.setupHint,
    toolCount: i.tools.length,
  }));
}

export function mergeMcpConfigSnippet(bridgeRoot: string): McpConfig {
  const manifestPath = path.join(bridgeRoot, "integrations", "mcp.manifest.json");
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as McpConfig;
  }
  return {
    mcpServers: {
      "agent-bridge": {
        command: "node",
        args: [path.join(bridgeRoot, "mcp-server", "dist", "index.js")],
      },
    },
  };
}
