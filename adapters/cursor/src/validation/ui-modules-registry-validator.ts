import * as fs from "node:fs";
import * as path from "node:path";

export const RISK_CLASS_VALUES = ["read", "destructive", "external-code"] as const;

export const UI_RISK_LEVEL_VALUES = [
  "n/a",
  "read-only",
  "low",
  "normal",
  "medium",
  "medium-high",
  "high",
  "destructive",
  "external-code",
  "inherit",
] as const;

export const RISK_VISIBILITY_VALUES = [
  "none",
  "badge",
  "banner",
  "confirmation",
  "blocked",
] as const;

export type UiRiskLevel = (typeof UI_RISK_LEVEL_VALUES)[number];
export type RiskVisibility = (typeof RISK_VISIBILITY_VALUES)[number];

export interface UiModuleEntry {
  moduleId: string;
  moduleVersion: string;
  enabled: boolean;
  category: string;
  uiRiskLevel: UiRiskLevel;
  riskVisibility: RiskVisibility;
  requiredPermissions: string[];
  supportedActions: string[];
  requiredDesignTokens: string[];
  requiredComponents: string[];
  requiredStates: string[];
  linkedPreviewSections: string[];
  implementationPhase: string;
  rollbackUndoVisibility?: { visible: boolean; reason?: string };
}

export interface UiModulesRegistry {
  schemaVersion: string;
  registryVersion: string;
  adapterId: string;
  runtimeActive: boolean;
  designrulesStatus: string;
  linkedCatalog: string;
  linkedCrosswalk: string;
  viewComposition: {
    viewId: string;
    layout: string;
    forbidden: string;
    moduleOrder: string[];
    crossCuttingModules: string[];
  };
  modules: UiModuleEntry[];
}

export interface ComponentCatalogEntry {
  id: string;
  allowedRiskLevels: string[];
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  summary?: {
    moduleOrderCount: number;
    crossCuttingModulesCount: number;
    totalModulesCount: number;
  };
}

const PREVIEW_SECTIONS = new Set(
  Array.from({ length: 17 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`),
);

const SKIP_COMPONENT_RISK_CHECK = new Set<UiRiskLevel>(["inherit", "n/a"]);

export function repoRootFrom(startDir: string): string {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "adapters", "cursor"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not find repo root from ${startDir}`);
    }
    dir = parent;
  }
}

function loadValidTokens(tokensPath: string): Set<string> {
  const raw = JSON.parse(fs.readFileSync(tokensPath, "utf8")) as {
    tokens: Record<string, string>;
    colorPresets: { "neutral-blue-gray": { colors: Record<string, string> } };
  };
  return new Set([
    ...Object.keys(raw.tokens),
    ...Object.keys(raw.colorPresets["neutral-blue-gray"].colors),
  ]);
}

function loadCatalogIds(catalogPath: string): Map<string, string[]> {
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
    components: ComponentCatalogEntry[];
    patterns: ComponentCatalogEntry[];
  };
  const map = new Map<string, string[]>();
  for (const entry of [...raw.components, ...raw.patterns]) {
    map.set(entry.id, entry.allowedRiskLevels);
  }
  return map;
}

function componentAllowsUiRiskLevel(allowed: string[], uiRiskLevel: UiRiskLevel): boolean {
  if (SKIP_COMPONENT_RISK_CHECK.has(uiRiskLevel)) return true;
  if (allowed.includes("n/a")) return true;
  if (allowed.includes(uiRiskLevel)) return true;
  if (uiRiskLevel === "low" && (allowed.includes("low") || allowed.includes("read-only"))) return true;
  if (uiRiskLevel === "read-only" && (allowed.includes("read-only") || allowed.includes("low") || allowed.includes("n/a"))) {
    return true;
  }
  if (uiRiskLevel === "medium-high" && (allowed.includes("medium-high") || allowed.includes("medium") || allowed.includes("high"))) {
    return true;
  }
  if (uiRiskLevel === "destructive" && (allowed.includes("destructive") || allowed.includes("high"))) return true;
  if (uiRiskLevel === "external-code" && (allowed.includes("external-code") || allowed.includes("high"))) return true;
  return false;
}

export function validateUiModulesRegistry(options: {
  registry: UiModulesRegistry;
  proposalModuleIds: string[];
  validTokens: Set<string>;
  catalogAllowedRisk: Map<string, string[]>;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { registry, proposalModuleIds, validTokens, catalogAllowedRisk } = options;

  if (registry.designrulesStatus !== "consumer-ready") {
    issues.push({
      code: "designrules-status",
      message: `designrulesStatus must be consumer-ready, got ${registry.designrulesStatus}`,
    });
  }

  if (registry.viewComposition.forbidden !== "monolithic-cursor-control-page") {
    issues.push({ code: "forbidden-layout", message: "viewComposition.forbidden must be monolithic-cursor-control-page" });
  }

  const moduleOrder = registry.viewComposition.moduleOrder;
  const crossCutting = registry.viewComposition.crossCuttingModules;
  const moduleOrderSet = new Set(moduleOrder);

  for (const id of crossCutting) {
    if (moduleOrderSet.has(id)) {
      issues.push({ code: "cross-cutting-in-order", message: `${id} must not appear in moduleOrder` });
    }
  }

  if (registry.modules.length !== 18) {
    issues.push({ code: "module-count", message: `Expected 18 modules, got ${registry.modules.length}` });
  }

  const registryIds = registry.modules.map((m) => m.moduleId);
  const registryIdSet = new Set(registryIds);
  if (registryIds.length !== registryIdSet.size) {
    issues.push({ code: "duplicate-module-id", message: "Duplicate moduleId in registry" });
  }

  for (const id of proposalModuleIds) {
    if (!registryIdSet.has(id)) {
      issues.push({ code: "missing-module", message: `Proposal module missing in registry: ${id}` });
    }
  }

  for (const id of registryIds) {
    if (!proposalModuleIds.includes(id)) {
      issues.push({ code: "extra-module", message: `Unexpected moduleId in registry: ${id}` });
    }
  }

  for (const mod of registry.modules) {
    if (!(UI_RISK_LEVEL_VALUES as readonly string[]).includes(mod.uiRiskLevel)) {
      issues.push({ code: "ui-risk-level", message: `${mod.moduleId}: invalid uiRiskLevel ${mod.uiRiskLevel}` });
    }
    if (!(RISK_VISIBILITY_VALUES as readonly string[]).includes(mod.riskVisibility)) {
      issues.push({ code: "risk-visibility", message: `${mod.moduleId}: invalid riskVisibility ${mod.riskVisibility}` });
    }

    for (const field of ["requiredDesignTokens", "requiredComponents", "requiredStates", "linkedPreviewSections"] as const) {
      const arr = mod[field];
      if (!Array.isArray(arr) || arr.length === 0) {
        issues.push({ code: "empty-field", message: `${mod.moduleId}: ${field} must be non-empty` });
      }
    }

    for (const token of mod.requiredDesignTokens) {
      if (!validTokens.has(token)) {
        issues.push({ code: "invalid-token", message: `${mod.moduleId}: unknown token ${token}` });
      }
    }

    for (const comp of mod.requiredComponents) {
      const allowed = catalogAllowedRisk.get(comp);
      if (!allowed) {
        issues.push({ code: "invalid-component", message: `${mod.moduleId}: unknown component ${comp}` });
        continue;
      }
      if (!componentAllowsUiRiskLevel(allowed, mod.uiRiskLevel)) {
        issues.push({
          code: "component-risk-mismatch",
          message: `${mod.moduleId}: component ${comp} allowedRiskLevels [${allowed.join(", ")}] incompatible with uiRiskLevel ${mod.uiRiskLevel}`,
        });
      }
    }

    for (const section of mod.linkedPreviewSections) {
      if (!PREVIEW_SECTIONS.has(section)) {
        issues.push({ code: "invalid-preview", message: `${mod.moduleId}: invalid preview section ${section}` });
      }
    }
  }

  const allStackAndCross = new Set([...moduleOrder, ...crossCutting]);
  for (const mod of registry.modules) {
    if (!allStackAndCross.has(mod.moduleId)) {
      issues.push({ code: "orphan-module", message: `${mod.moduleId} not in moduleOrder or crossCuttingModules` });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      moduleOrderCount: moduleOrder.length,
      crossCuttingModulesCount: crossCutting.length,
      totalModulesCount: registry.modules.length,
    },
  };
}

export function validateUiModulesRegistryFiles(repoRoot: string): ValidationResult {
  const registryPath = path.join(repoRoot, "adapters/cursor/registry/poc-v1-ui-modules.json");
  const proposalPath = path.join(repoRoot, "adapters/cursor/registry/p1-ui-modules.proposal.json");
  const catalogPath = path.join(repoRoot, "docs/global-design/control-rules/tokens/control.components.json");
  const tokensPath = path.join(repoRoot, "docs/global-design/control-rules/tokens/control.tokens.json");

  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as UiModulesRegistry;
  const proposal = JSON.parse(fs.readFileSync(proposalPath, "utf8")) as {
    modules: Array<{ moduleId: string }>;
  };

  return validateUiModulesRegistry({
    registry,
    proposalModuleIds: proposal.modules.map((m) => m.moduleId),
    validTokens: loadValidTokens(tokensPath),
    catalogAllowedRisk: loadCatalogIds(catalogPath),
  });
}

export function formatValidationResult(result: ValidationResult): string {
  if (result.ok && result.summary) {
    return [
      "OK",
      `moduleOrder count: ${result.summary.moduleOrderCount}`,
      `crossCuttingModules count: ${result.summary.crossCuttingModulesCount}`,
      `total modules count: ${result.summary.totalModulesCount}`,
    ].join("\n");
  }
  return result.issues.map((i) => `${i.code}: ${i.message}`).join("\n");
}
