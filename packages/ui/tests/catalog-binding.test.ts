import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const componentsDir = join(__dirname, "..", "src/components");

const EXPECTED_CATALOG_IDS = [
  "control.component.button.primary",
  "control.component.button.secondary",
  "control.component.button.danger",
  "control.component.card.surface",
  "control.component.card.status",
  "control.component.moduleSection",
  "control.component.moduleSection.header",
  "control.component.badge.risk",
  "control.component.badge.subsystem",
  "control.component.badge.count",
  "control.component.skeleton.block",
  "control.component.list.empty",
];

function collectComponentTsx(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectComponentTsx(full));
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

describe("catalog component binding", () => {
  it("component sources reference all catalog ids", () => {
    const files = collectComponentTsx(componentsDir).filter(
      (file) => !file.includes("PreviewShell"),
    );
    const combined = files.map((file) => readFileSync(file, "utf8")).join("\n");

    for (const id of EXPECTED_CATALOG_IDS) {
      expect(combined.includes(`"${id}"`), `missing catalog id: ${id}`).toBe(true);
    }
  });
});
