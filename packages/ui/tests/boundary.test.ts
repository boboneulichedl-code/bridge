import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pkgRoot = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const FORBIDDEN_DEPS = [
  "@bridge/cursor-adapter",
  "bridge-api",
  "bridge-web",
  "@bridge/ui-cursor",
];

const FORBIDDEN_IMPORT_SNIPPETS = ["adapters/cursor", "bridge-web", "preview/static", "bridge-api"];

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(full));
    else if (entry.name.endsWith(".ts")) files.push(full);
  }
  return files;
}

describe("@bridge/ui package boundary", () => {
  it("has no forbidden runtime or dev dependencies", () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const forbidden of FORBIDDEN_DEPS) {
      expect(deps[forbidden]).toBeUndefined();
    }
  });

  it("does not import cursor, api, web, or preview paths in src", () => {
    const files = collectSourceFiles(join(pkgRoot, "src"));
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const snippet of FORBIDDEN_IMPORT_SNIPPETS) {
        expect(content.includes(snippet), `${file} must not reference ${snippet}`).toBe(false);
      }
    }
  });
});
