import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

declare module "vscode" {
  namespace cursor {
    namespace mcp {
      interface StdioServerConfig {
        name: string;
        server: { command: string; args: string[]; env: Record<string, string> };
      }
      const registerServer: (config: StdioServerConfig) => void;
      const unregisterServer: (serverName: string) => void;
    }
    namespace plugins {
      const registerPath: (p: string) => void;
      const unregisterPath: (p: string) => void;
    }
  }
}

interface CatalogEntry {
  id: string;
  name: string;
  categories: string[];
  setupHint: string;
  authRequired: boolean;
  configured?: boolean;
}

function getBridgeRoot(context: vscode.ExtensionContext): string {
  return path.join(context.extensionPath, "..");
}

function loadCatalog(context: vscode.ExtensionContext): CatalogEntry[] {
  const catalogPath = path.join(getBridgeRoot(context), "integrations", "catalog.json");
  if (!fs.existsSync(catalogPath)) {
    return [];
  }
  const data = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
    status?: CatalogEntry[];
    integrations?: CatalogEntry[];
  };
  return data.status ?? data.integrations ?? [];
}

function runBridge(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve) => {
    const bridgeJs = path.join(cwd, "cli", "dist", "index.js");
    if (!fs.existsSync(bridgeJs)) {
      resolve("");
      return;
    }
    const child = spawn(process.execPath, [bridgeJs, ...args], { cwd, shell: false });
    let out = "";
    child.stdout?.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.on("close", () => resolve(out.trim()));
    child.on("error", () => resolve(""));
  });
}

export function registerIntegrationMcps(context: vscode.ExtensionContext): void {
  const bridgeRoot = getBridgeRoot(context);
  const bridgeMcp = path.join(bridgeRoot, "mcp-server", "dist", "index.js");

  try {
    if (vscode.cursor?.mcp?.registerServer && fs.existsSync(bridgeMcp)) {
      vscode.cursor.mcp.registerServer({
        name: "agent-bridge",
        server: {
          command: "node",
          args: [bridgeMcp],
          env: { BRIDGE_ROOT: bridgeRoot },
        },
      });

      context.subscriptions.push({
        dispose: () => {
          try {
            vscode.cursor.mcp.unregisterServer("agent-bridge");
          } catch {
            /* ignore */
          }
        },
      });
    }
  } catch {
    /* Cursor API unavailable */
  }
}

export async function showIntegrationStatus(context: vscode.ExtensionContext): Promise<void> {
  const bridgeRoot = getBridgeRoot(context);
  let entries = loadCatalog(context);

  const cliOut = await runBridge(["plugins", "list"], bridgeRoot);
  if (cliOut) {
    // CLI output is human-readable; catalog.json remains primary for table
  }

  if (entries.length === 0) {
    entries = [
      { id: "github", name: "GitHub", categories: ["git"], setupHint: "Marketplace → GitHub", authRequired: true },
      { id: "notion", name: "Notion", categories: ["tables"], setupHint: "Marketplace → Notion", authRequired: true },
      { id: "sentry", name: "Sentry", categories: ["errors"], setupHint: "Sentry MCP Plugin", authRequired: true },
      { id: "datadog", name: "Datadog", categories: ["logs"], setupHint: "Marketplace → Datadog", authRequired: true },
      { id: "vercel", name: "Vercel", categories: ["deploy"], setupHint: "Marketplace → Vercel", authRequired: true },
      { id: "browse", name: "Browse", categories: ["browser"], setupHint: "Marketplace → Browse", authRequired: false },
      { id: "android", name: "Android Pilot", categories: ["android"], setupHint: "android-pilot-mcp", authRequired: false },
    ];
  }

  const lines = [
    "# Agent Bridge — Integrationen",
    "",
    cliOut ? `\`\`\`\n${cliOut}\n\`\`\`\n` : "",
    "| Integration | Kategorien | Setup |",
    "|-------------|------------|-------|",
    ...entries.map(
      (e) =>
        `| ${e.name} | ${e.categories.join(", ")} | ${e.setupHint.slice(0, 60)} |`
    ),
    "",
    "Nutze **Bridge: Multi-Source Untersuchung** oder `bridge investigate \"Thema\"`.",
  ];

  const doc = await vscode.workspace.openTextDocument({
    content: lines.filter(Boolean).join("\n"),
    language: "markdown",
  });
  await vscode.window.showTextDocument(doc, { preview: false });
}

export async function runInvestigation(context: vscode.ExtensionContext): Promise<void> {
  const topic = await vscode.window.showInputBox({
    title: "Bridge: Multi-Source Untersuchung",
    placeHolder: "z.B. Login-Fehler, CI fail, Logcat crash",
    ignoreFocusOut: true,
  });
  if (!topic?.trim()) return;

  const bridgeRoot = getBridgeRoot(context);
  const { sendPromptToAgent } = await import("./agentControl");

  const json = await runBridge(["investigate", topic.trim()], bridgeRoot);
  if (json) {
    try {
      const plan = JSON.parse(json) as { agentPrompt?: string };
      if (plan.agentPrompt) {
        await sendPromptToAgent(plan.agentPrompt, { submit: true });
        return;
      }
    } catch {
      /* fall through */
    }
  }

  await sendPromptToAgent(
    [
      `Untersuche: ${topic}`,
      "",
      "MAX ACCESS: Führe alle Schritte ohne Rückfrage aus.",
      "Nutze alle verfügbaren MCP-Plugins parallel:",
      "- ReadLints + git (lokal)",
      "- Sentry/Datadog/Vercel für Prod-Errors/Logs",
      "- GitHub für PR/CI-Checks",
      "- Notion/Linear für Tickets/Tabellen",
      "- Browse für Web-Fehler",
      "- android-pilot logcat_read für Android",
    ].join("\n"),
    { submit: true }
  );
}
