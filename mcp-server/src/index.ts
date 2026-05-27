#!/usr/bin/env node

import { spawn } from "node:child_process";
import * as path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  appendMaxAccessAgentFlags,
  buildInvestigationPlan,
  getIntegrationGuide,
  isMaxAccessEnabled,
  listIntegrationStatus,
  mergeMcpConfigSnippet,
  routeIntent,
} from "@bridge/shared";

const BRIDGE_ROOT = process.env.BRIDGE_ROOT || path.resolve(__dirname, "..", "..");

function runAgent(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const bin = process.env.BRIDGE_AGENT_BIN || (process.platform === "win32" ? "agent.exe" : "agent");

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      shell: process.platform === "win32",
      env: process.env,
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

function textResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

const server = new Server(
  { name: "agent-bridge", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "bridge_list_integrations",
      description:
        "Listet alle unterstützten Integrationen (GitHub, Notion, Linear, Sentry, Datadog, Vercel, Browse, Android, …) mit Konfigurationsstatus.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "bridge_route",
      description:
        "Routet einen Intent (errors, git, logs, tables, logcat, browser, deploy, investigate) zu passenden MCP-Tools und lokalen Schritten.",
      inputSchema: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            description: "errors | git | logs | tables | logcat | android | browser | deploy | investigate | all",
          },
          query: { type: "string", description: "Optionale natürlichsprachige Aufgabe" },
        },
        required: ["intent"],
      },
    },
    {
      name: "bridge_investigate",
      description:
        "Erstellt einen Multi-Source Debugging-Plan: sammelt lokalen Git-Kontext und listet MCP-Tool-Aufrufe für alle konfigurierten Plugins.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Was untersucht werden soll" },
          categories: {
            type: "array",
            items: { type: "string" },
            description: "Optional: errors, git, logs, tables, android, browser, deploy",
          },
        },
        required: ["topic"],
      },
    },
    {
      name: "bridge_integration_guide",
      description: "Detaillierte Anleitung + Tool-Liste für eine Integration (github, notion, sentry, …).",
      inputSchema: {
        type: "object",
        properties: {
          integration_id: { type: "string" },
        },
        required: ["integration_id"],
      },
    },
    {
      name: "bridge_mcp_manifest",
      description: "Gibt empfohlene mcp.json-Einträge für optionale Integrationen zurück.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "bridge_send_prompt",
      description: "Sendet einen Prompt an den Cursor-Agent (non-interactive via agent -p).",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          mode: { type: "string", enum: ["agent", "plan", "ask"] },
          force: { type: "boolean", default: true },
          cwd: { type: "string" },
        },
        required: ["prompt"],
      },
    },
    {
      name: "bridge_list_sessions",
      description: "Listet vorherige Agent-Sessions (agent ls).",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "bridge_shortcuts",
      description: "Tastenkürzel und CLI-Befehle.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "bridge_max_access_status",
      description: "Zeigt ob Bridge Max Access aktiv ist (Auto-Allow Hooks, Force, Trust).",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "bridge_open_ide",
      description: "Öffnet Composer/Chat in Cursor IDE.",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", enum: ["composer", "chat", "agent", "fullscreen"] },
        },
        required: ["target"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case "bridge_list_integrations":
        return textResult(JSON.stringify(listIntegrationStatus(), null, 2));

      case "bridge_route": {
        const result = routeIntent(String(a.intent ?? ""), a.query ? String(a.query) : undefined);
        return textResult(JSON.stringify(result, null, 2));
      }

      case "bridge_investigate": {
        const plan = await buildInvestigationPlan(
          String(a.topic ?? ""),
          Array.isArray(a.categories) ? a.categories.map(String) : undefined
        );
        return textResult(JSON.stringify(plan, null, 2));
      }

      case "bridge_integration_guide":
        return textResult(getIntegrationGuide(String(a.integration_id ?? "")));

      case "bridge_mcp_manifest":
        return textResult(JSON.stringify(mergeMcpConfigSnippet(BRIDGE_ROOT), null, 2));

      case "bridge_send_prompt": {
        const prompt = String(a.prompt ?? "");
        const maxAccess = isMaxAccessEnabled();
        let agentArgs = ["-p", "--output-format", "text"];
        if (a.mode) agentArgs.push(`--mode=${a.mode}`);
        if (a.force !== false && maxAccess) agentArgs.push("--force");
        else if (a.force === true) agentArgs.push("--force");
        agentArgs.push(prompt);
        agentArgs = appendMaxAccessAgentFlags(agentArgs, maxAccess);

        const prevCwd = process.cwd();
        if (a.cwd && typeof a.cwd === "string") process.chdir(a.cwd);
        const result = await runAgent(agentArgs);
        if (a.cwd) process.chdir(prevCwd);

        return textResult(
          result.code === 0 ? result.stdout : result.stderr || result.stdout,
          result.code !== 0
        );
      }

      case "bridge_list_sessions": {
        const result = await runAgent(["ls"]);
        return textResult(result.stdout || result.stderr, result.code !== 0);
      }

      case "bridge_shortcuts":
        return textResult(`Bridge Extension: Ctrl+Alt+A/P/K
CLI: bridge plugins list | bridge route errors | bridge investigate "topic"
MCP: bridge_list_integrations, bridge_route, bridge_investigate`);

      case "bridge_max_access_status":
        return textResult(
          JSON.stringify(
            {
              enabled: isMaxAccessEnabled(),
              env: process.env.BRIDGE_MAX_ACCESS ?? null,
              effects: [
                "CLI: --force --trust --approve-mcps",
                "Hooks: auto-allow Shell/MCP/Tools",
                "Extension: autoSubmitPrompt",
              ],
            },
            null,
            2
          )
        );

      case "bridge_open_ide": {
        const target = String(a.target ?? "composer");
        const commandMap: Record<string, string> = {
          composer: "composer.openComposer",
          chat: "workbench.action.chat.open",
          agent: "composer.newAgentChat",
          fullscreen: "composer.openComposerFullscreen",
        };
        const cursorBin = process.platform === "win32" ? "cursor.cmd" : "cursor";
        await new Promise<void>((resolve, reject) => {
          const child = spawn(cursorBin, ["--command", commandMap[target] ?? commandMap.composer], {
            shell: process.platform === "win32",
          });
          child.on("error", reject);
          child.on("close", () => resolve());
        });
        return textResult(`Cursor geöffnet: ${target}`);
      }

      default:
        return textResult(`Unbekanntes Tool: ${name}`, true);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return textResult(`Fehler: ${message}`, true);
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
