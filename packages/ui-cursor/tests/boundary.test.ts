import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pkgRoot = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const FORBIDDEN_DEPS = ["@bridge/cursor-adapter", "bridge-api", "bridge-web"];
const FORBIDDEN_IMPORT_SNIPPETS = [
  "adapters/cursor",
  "bridge-web",
  "preview/static",
  "web/src",
  "bridge-api",
];

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

describe("@bridge/ui-cursor package boundary", () => {
  it("depends only on @bridge/ui at runtime", () => {
    expect(pkg.dependencies).toEqual({ "@bridge/ui": "*" });
    for (const forbidden of FORBIDDEN_DEPS) {
      expect(pkg.dependencies?.[forbidden]).toBeUndefined();
      expect(pkg.devDependencies?.[forbidden]).toBeUndefined();
    }
  });

  it("does not import web, preview, cursor adapter, or api paths in src", () => {
    const files = collectSourceFiles(join(pkgRoot, "src"));
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const snippet of FORBIDDEN_IMPORT_SNIPPETS) {
        expect(content.includes(snippet), `${file} must not reference ${snippet}`).toBe(false);
      }
    }
  });
});
