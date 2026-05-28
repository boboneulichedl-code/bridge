import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  formatValidationResult,
  repoRootFrom,
  validateUiModulesRegistry,
  validateUiModulesRegistryFiles,
} from "../src/validation/ui-modules-registry-validator";

describe("poc-v1-ui-modules registry validation", () => {
  it("validates the committed registry against catalog, tokens, and proposal", () => {
    const repoRoot = repoRootFrom(path.join(__dirname, ".."));
    const result = validateUiModulesRegistryFiles(repoRoot);

    expect(result.ok, formatValidationResult(result)).toBe(true);
    expect(result.summary).toEqual({
      moduleOrderCount: 15,
      crossCuttingModulesCount: 3,
      totalModulesCount: 18,
    });
  });

  it("rejects empty requiredComponents", () => {
    const repoRoot = repoRootFrom(path.join(__dirname, ".."));
    const base = validateUiModulesRegistryFiles(repoRoot);
    expect(base.ok).toBe(true);

    const registryPath = path.join(repoRoot, "adapters/cursor/registry/poc-v1-ui-modules.json");
    const proposalPath = path.join(repoRoot, "adapters/cursor/registry/p1-ui-modules.proposal.json");
    const catalogPath = path.join(repoRoot, "docs/global-design/control-rules/tokens/control.components.json");
    const tokensPath = path.join(repoRoot, "docs/global-design/control-rules/tokens/control.tokens.json");

    const registry = structuredClone(
      JSON.parse(fs.readFileSync(registryPath, "utf8")),
    );
    registry.modules[0].requiredComponents = [];

    const proposal = JSON.parse(fs.readFileSync(proposalPath, "utf8"));
    const tokensRaw = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
    const catalogRaw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

    const validTokens = new Set([
      ...Object.keys(tokensRaw.tokens),
      ...Object.keys(tokensRaw.colorPresets["neutral-blue-gray"].colors),
    ]);
    const catalogAllowedRisk = new Map<string, string[]>();
    for (const entry of [...catalogRaw.components, ...catalogRaw.patterns]) {
      catalogAllowedRisk.set(entry.id, entry.allowedRiskLevels);
    }

    const result = validateUiModulesRegistry({
      registry,
      proposalModuleIds: proposal.modules.map((m: { moduleId: string }) => m.moduleId),
      validTokens,
      catalogAllowedRisk,
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "empty-field")).toBe(true);
  });
});
