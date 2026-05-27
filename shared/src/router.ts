import { getIntegrationsByCategory, getIntegration, INTEGRATIONS } from "./integrations";
import { isIntegrationConfigured } from "./mcp-config";
import type { IntegrationCategory, RouteResult } from "./types";

const INTENT_MAP: Record<string, IntegrationCategory[]> = {
  errors: ["errors"],
  git: ["git"],
  logs: ["logs"],
  tables: ["tables"],
  logcat: ["android"],
  android: ["android"],
  browser: ["browser"],
  deploy: ["deploy"],
  flags: ["flags"],
  design: ["design"],
  investigate: ["errors", "git", "logs", "deploy"],
  all: ["errors", "git", "logs", "tables", "android", "browser", "deploy", "flags", "design"],
};

export function routeIntent(intent: string, query?: string): RouteResult {
  const normalized = intent.toLowerCase().trim();
  const categories =
    INTENT_MAP[normalized] ??
    inferCategoriesFromQuery(query ?? intent);

  const seen = new Set<string>();
  const integrations: RouteResult["integrations"] = [];

  for (const cat of categories) {
    const defs = getIntegrationsByCategory(cat);
    for (const def of defs) {
      if (seen.has(def.id)) continue;
      seen.add(def.id);
      integrations.push({
        id: def.id,
        name: def.name,
        configured: isIntegrationConfigured(def),
        priority: def.builtin ? 1 : isIntegrationConfigured(def) ? 0 : 2,
        tools: def.tools,
        setupHint: !isIntegrationConfigured(def) ? def.setupHint : undefined,
      });
    }
  }

  integrations.sort((a, b) => a.priority - b.priority);

  const localSteps: string[] = [];
  if (categories.includes("git")) {
    localSteps.push("Shell: git status && git diff --stat");
  }
  if (categories.includes("errors")) {
    localSteps.push("ReadLints für aktuelle Workspace-Fehler");
  }

  const toolLines = integrations
    .filter((i) => i.configured && i.id !== "agent-bridge")
    .flatMap((i) => i.tools.slice(0, 2).map((t) => `${i.name}.${t.name}`));

  const suggestedPrompt = [
    query ? `Aufgabe: ${query}` : `Intent: ${intent}`,
    "",
    "Nutze diese Quellen in Prioritäts-Reihenfolge:",
    ...localSteps.map((s) => `- ${s}`),
    ...toolLines.map((t) => `- MCP: ${t}`),
    "",
    "Kombiniere Ergebnisse und berichte strukturiert.",
  ].join("\n");

  return { intent: normalized, integrations, localSteps, suggestedPrompt };
}

function inferCategoriesFromQuery(text: string): IntegrationCategory[] {
  const t = text.toLowerCase();
  const cats = new Set<IntegrationCategory>();
  if (/error|bug|crash|lint|exception/.test(t)) cats.add("errors");
  if (/git|commit|branch|pr/.test(t)) cats.add("git");
  if (/log|trace/.test(t)) cats.add("logs");
  if (/notion|linear|table|database|issue/.test(t)) cats.add("tables");
  if (/logcat|android/.test(t)) cats.add("android");
  if (/browser|web/.test(t)) cats.add("browser");
  if (/vercel|deploy|build/.test(t)) cats.add("deploy");
  if (cats.size === 0) cats.add("errors");
  return [...cats];
}

export function getIntegrationGuide(integrationId: string): string {
  const def = getIntegration(integrationId);
  if (!def) {
    return `Unbekannte Integration: ${integrationId}. Verfügbar: ${INTEGRATIONS.map((i) => i.id).join(", ")}`;
  }

  const configured = isIntegrationConfigured(def);
  return [
    `# ${def.name} (${def.id})`,
    "",
    `Status: ${configured ? "✅ konfiguriert" : "⚠️ nicht konfiguriert"}`,
    `Auth: ${def.authRequired ? "ja" : "nein"}`,
    `Kategorien: ${def.categories.join(", ")}`,
    "",
    "## Setup",
    def.setupHint,
    "",
    "## MCP Server Keys",
    def.mcpServerKeys.length ? def.mcpServerKeys.join(", ") : "(builtin)",
    "",
    "## Tools",
    ...def.tools.map(
      (t) =>
        `- **${t.name}**: ${t.description}${t.exampleArgs ? `\n  Beispiel: \`${JSON.stringify(t.exampleArgs)}\`` : ""}`
    ),
    "",
    "## Bridge-Routing",
    "Rufe `bridge_route` mit intent passend zu dieser Integration auf, oder `bridge_investigate` für Multi-Source.",
  ].join("\n");
}
