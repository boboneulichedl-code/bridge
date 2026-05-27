import * as fs from "node:fs";
import * as path from "node:path";
import {
  buildInvestigationPlan,
  getIntegrationGuide,
  listIntegrationStatus,
  mergeMcpConfigSnippet,
  routeIntent,
} from "@bridge/shared";
import { cmdMaxAccess } from "./max-access";

export async function cmdPluginsList(): Promise<number> {
  const status = listIntegrationStatus();
  console.log("\nAgent Bridge — Integrationen\n");
  for (const s of status) {
    const mark = s.configured ? "✓" : "○";
    console.log(`  ${mark} ${s.name.padEnd(20)} [${s.categories.join(", ")}]`);
    if (!s.configured && s.authRequired) {
      console.log(`      → ${s.setupHint}`);
    }
  }
  console.log(`\n${status.filter((s) => s.configured).length}/${status.length} konfiguriert\n`);
  return 0;
}

export async function cmdPluginsGuide(id: string): Promise<number> {
  if (!id) {
    console.error("Verwendung: bridge plugins guide <integration-id>");
    console.error("IDs: github, notion, linear, sentry, datadog, vercel, browse, android, …");
    return 1;
  }
  console.log(getIntegrationGuide(id));
  return 0;
}

export async function cmdRoute(intent: string, query?: string): Promise<number> {
  if (!intent) {
    console.error("Verwendung: bridge route <intent> [query]");
    console.error("Intents: errors, git, logs, tables, logcat, browser, deploy, investigate, all");
    return 1;
  }
  const result = routeIntent(intent, query);
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

export async function cmdInvestigate(topic: string, categories?: string[]): Promise<number> {
  if (!topic) {
    console.error('Verwendung: bridge investigate "Thema" [--categories errors,git,logs]');
    return 1;
  }
  const plan = await buildInvestigationPlan(topic, categories);
  console.log(JSON.stringify(plan, null, 2));
  return 0;
}

export function cmdManifest(): number {
  const root = path.resolve(__dirname, "..", "..");
  console.log(JSON.stringify(mergeMcpConfigSnippet(root), null, 2));
  return 0;
}

export function cmdInstallMcp(dryRun: boolean): Promise<number> {
  return cmdInstallAll(dryRun, { mcpOnly: true });
}

function resolveBridgeMcpEntry(
  root: string,
  entry: Record<string, unknown>
): Record<string, unknown> {
  const bridgeScript = path.join(root, "mcp-server", "dist", "index.js");
  const args = (entry.args as string[] | undefined)?.map((a) => {
    if (a.includes("mcp-server") || a.includes("${BRIDGE_ROOT}") || a.includes("${workspaceFolder}")) {
      return bridgeScript;
    }
    return a.replace(/\$\{BRIDGE_ROOT\}/g, root).replace(/\$\{workspaceFolder\}/g, root);
  });
  return {
    ...entry,
    ...(args ? { args } : {}),
    env: {
      ...(entry.env as Record<string, string> | undefined),
      BRIDGE_ROOT: root,
      BRIDGE_MAX_ACCESS: "1",
    },
  };
}

export async function cmdInstallAll(
  dryRun: boolean,
  opts: { mcpOnly?: boolean } = {}
): Promise<number> {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const configPath = path.join(home, ".cursor", "mcp.json");
  const root = path.resolve(__dirname, "..", "..");
  const snippet = mergeMcpConfigSnippet(root);

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    existing = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const servers = { ...((existing.mcpServers as Record<string, unknown>) ?? {}) };
  for (const [key, entry] of Object.entries(snippet.mcpServers ?? {})) {
    if (key === "agent-bridge") {
      servers[key] = resolveBridgeMcpEntry(root, entry as Record<string, unknown>);
    } else {
      servers[key] = entry;
    }
  }

  const merged = { ...existing, mcpServers: servers };

  if (dryRun) {
    console.log(JSON.stringify(merged, null, 2));
    return 0;
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
  console.log(`MCP-Server in ${configPath} eingetragen:`);
  for (const key of Object.keys(snippet.mcpServers ?? {})) {
    console.log(`  ✓ ${key}`);
  }

  if (opts.mcpOnly) {
    return 0;
  }

  cmdMaxAccess("on", root);

  const mcpServerPath = path.join(root, "mcp-server", "dist", "index.js");
  if (!fs.existsSync(mcpServerPath)) {
    console.log("\nHinweis: npm run build ausführen, dann Cursor neu laden.");
    return 0;
  }

  await prefetchMcpPackages(snippet);
  await installBridgeExtension(root);

  console.log("\nInstallation abgeschlossen. Cursor: Reload Window (Ctrl+Shift+P).");
  console.log("Marketplace-Plugins (Notion, Linear, Vercel, …) in Cursor Settings → Plugins aktivieren.");
  return 0;
}

async function prefetchMcpPackages(snippet: ReturnType<typeof mergeMcpConfigSnippet>): Promise<void> {
  const { spawn } = await import("node:child_process");
  const npxPackages = new Set<string>();

  for (const entry of Object.values(snippet.mcpServers ?? {})) {
    const e = entry as { command?: string; args?: string[] };
    if (e.command === "npx" && e.args?.length) {
      const pkg = e.args.find((a) => !a.startsWith("-"));
      if (pkg) npxPackages.add(pkg);
    }
  }

  for (const pkg of npxPackages) {
    console.log(`\nPrefetch: ${pkg}…`);
    await new Promise<void>((resolve) => {
      const child = spawn("npx", ["-y", pkg, "--help"], {
        shell: true,
        stdio: "ignore",
      });
      child.on("error", () => resolve());
      child.on("close", () => resolve());
    });
    console.log(`  ✓ ${pkg}`);
  }
}

async function installBridgeExtension(root: string): Promise<void> {
  const { spawn } = await import("node:child_process");
  const vsixDir = path.join(root, "extension");
  const vsixFiles = fs.existsSync(vsixDir)
    ? fs.readdirSync(vsixDir).filter((f) => f.endsWith(".vsix"))
    : [];
  let vsix = vsixFiles.sort().at(-1);
  if (!vsix) {
    console.log("\nExtension-VSIX bauen…");
    await new Promise<void>((resolve) => {
      const child = spawn("npm", ["run", "package:extension"], {
        cwd: root,
        shell: true,
        stdio: "inherit",
      });
      child.on("close", () => resolve());
    });
    vsix = fs.readdirSync(vsixDir).filter((f) => f.endsWith(".vsix")).sort().at(-1);
  }
  if (!vsix) {
    console.log("  ○ VSIX nicht gefunden — Extension manuell installieren");
    return;
  }

  const vsixPath = path.join(vsixDir, vsix);
  console.log(`\nExtension installieren: ${vsix}`);
  const bins = process.platform === "win32" ? ["cursor.cmd", "cursor"] : ["cursor"];
  for (const bin of bins) {
    const code = await new Promise<number>((resolve) => {
      const child = spawn(bin, ["--install-extension", vsixPath, "--force"], {
        shell: true,
        stdio: "inherit",
      });
      child.on("error", () => resolve(1));
      child.on("close", (c) => resolve(c ?? 1));
    });
    if (code === 0) {
      console.log("  ✓ Extension installiert");
      return;
    }
  }
  console.log("  ○ cursor CLI nicht gefunden — VSIX manuell installieren:");
  console.log(`    ${vsixPath}`);
}
