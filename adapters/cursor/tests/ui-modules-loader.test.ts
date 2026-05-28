import { describe, expect, it, beforeEach } from "vitest";
import path from "node:path";
import {
  buildUiModulesResponse,
  getUiModulesRegistry,
  getUiModulesRegistryVersion,
  loadRegistries,
  resetRegistryCache,
} from "../src/index";

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = path.join(__dirname, "..", "registry");
  loadRegistries();
});

describe("ui-modules registry loader", () => {
  it("loads poc-v1-ui-modules.json from registry dir", () => {
    const reg = getUiModulesRegistry();
    expect(reg.registryVersion).toBe("poc-v1.3.0");
    expect(reg.designrulesStatus).toBe("consumer-ready");
    expect(reg.modules).toHaveLength(18);
  });

  it("exposes ui modules registry version", () => {
    expect(getUiModulesRegistryVersion()).toBe("poc-v1.3.0");
  });

  it("buildUiModulesResponse omits linkedCatalog and linkedCrosswalk", () => {
    const reg = getUiModulesRegistry();
    expect(reg.linkedCatalog).toBeTruthy();
    expect(reg.linkedCrosswalk).toBeTruthy();

    const response = buildUiModulesResponse();
    expect(response).not.toHaveProperty("linkedCatalog");
    expect(response).not.toHaveProperty("linkedCrosswalk");
    expect(response.modules).toHaveLength(18);
    expect(response.viewComposition.moduleOrder).toHaveLength(15);
    expect(response.viewComposition.crossCuttingModules).toHaveLength(3);

    for (const mod of response.modules) {
      expect(mod).not.toHaveProperty("linkedCatalog");
      expect(mod).not.toHaveProperty("linkedCrosswalk");
    }
  });

  it("returns client-safe module metadata fields", () => {
    const response = buildUiModulesResponse();
    const first = response.modules[0];
    expect(first.moduleId).toMatch(/^bridge\.ui\./);
    expect(first.requiredDesignTokens.length).toBeGreaterThan(0);
    expect(first.requiredComponents.length).toBeGreaterThan(0);
  });
});
