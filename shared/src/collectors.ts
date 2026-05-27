import { spawn } from "node:child_process";
import type { InvestigationPlan } from "./types";
import { getIntegrationsByCategory } from "./integrations";
import { isIntegrationConfigured } from "./mcp-config";

function runShell(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(cmd, {
      shell: true,
      cwd: cwd ?? process.cwd(),
      env: process.env,
    });
    let out = "";
    child.stdout?.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.on("close", () => resolve(out.trim()));
    child.on("error", () => resolve(""));
  });
}

export async function collectLocalGitContext(): Promise<string> {
  const parts = await Promise.all([
    runShell("git status -sb 2>nul || git status -sb 2>/dev/null"),
    runShell("git diff --stat 2>nul || git diff --stat 2>/dev/null"),
    runShell("git log -5 --oneline 2>nul || git log -5 --oneline 2>/dev/null"),
  ]);
  return parts.filter(Boolean).join("\n\n---\n\n");
}

export async function buildInvestigationPlan(
  topic: string,
  categories?: string[]
): Promise<InvestigationPlan> {
  const cats = (categories?.length ? categories : inferCategories(topic)) as Array<
    "git" | "errors" | "logs" | "tables" | "android" | "browser" | "deploy"
  >;

  const localContext: Record<string, string> = {};

  if (cats.includes("git") || topic.toLowerCase().includes("git")) {
    localContext.git = await collectLocalGitContext();
  }

  const mcpSteps: InvestigationPlan["mcpSteps"] = [];

  for (const cat of cats) {
    const integrations = getIntegrationsByCategory(cat).filter(
      (i) => !i.builtin && isIntegrationConfigured(i)
    );

    for (const integration of integrations) {
      const tool = integration.tools[0];
      if (!tool) continue;
      mcpSteps.push({
        integrationId: integration.id,
        tool: tool.name,
        args: tool.exampleArgs ?? {},
        reason: `${integration.name} für ${cat}: ${tool.description}`,
      });
    }
  }

  // Always suggest unconfigured but relevant integrations
  const missing = cats.flatMap((cat) =>
    getIntegrationsByCategory(cat).filter(
      (i) => !i.builtin && !isIntegrationConfigured(i)
    )
  );

  const agentPrompt = [
    `Untersuche: ${topic}`,
    "",
    "=== Lokaler Kontext ===",
    ...Object.entries(localContext).map(([k, v]) => `## ${k}\n${v || "(leer)"}`),
    "",
    "=== MCP-Schritte (parallel wo möglich) ===",
    ...mcpSteps.map(
      (s, i) =>
        `${i + 1}. [${s.integrationId}] ${s.tool}(${JSON.stringify(s.args)}) — ${s.reason}`
    ),
    "",
    missing.length
      ? `=== Fehlende Integrationen (Setup empfohlen) ===\n${missing.map((m) => `- ${m.name}: ${m.setupHint}`).join("\n")}`
      : "",
    "",
    "Fasse alle Quellen zusammen und schlage konkrete Fixes vor.",
  ]
    .filter(Boolean)
    .join("\n");

  return { topic, localContext, mcpSteps, agentPrompt };
}

function inferCategories(topic: string): string[] {
  const t = topic.toLowerCase();
  const cats: string[] = [];

  if (/git|commit|branch|pr|pull.?request|merge/.test(t)) cats.push("git");
  if (/error|bug|crash|exception|fail|lint|diagnostic/.test(t)) cats.push("errors");
  if (/log|trace|metric|monitor/.test(t)) cats.push("logs");
  if (/table|database|notion|linear|issue|task|ticket/.test(t)) cats.push("tables");
  if (/logcat|android|adb|apk/.test(t)) cats.push("android");
  if (/browser|web|dom|network|console/.test(t)) cats.push("browser");
  if (/deploy|vercel|build|ci|pipeline/.test(t)) cats.push("deploy");

  if (cats.length === 0) {
    cats.push("errors", "git", "logs");
  }
  return cats;
}
