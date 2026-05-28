import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const pkgRoot = join(__dirname, "..");
const srcRoot = join(pkgRoot, "src");
const rulesPath = join(
  pkgRoot,
  "../../docs/global-design/control-rules/global-control-design-rules.md",
);

const FORBIDDEN_IMPORT_SNIPPETS = [
  "@bridge/ui-cursor",
  "@bridge/cursor-adapter",
  "adapters/cursor",
  "bridge-api",
  "bridge-web",
  "web/",
  "preview/static",
];

const HARDCODED_COLOR_PATTERNS = [
  { name: "hex color", pattern: /#([0-9a-fA-F]{3,8})\b/ },
  { name: "rgb(", pattern: /\brgb\s*\(/ },
  { name: "hsl(", pattern: /\bhsl\s*\(/ },
];

const REQUIRED_RULE_PHRASES = [
  "React component binding (@bridge/ui)",
  "MUST use semantic design tokens",
  "MUST NOT use hardcoded hex",
  "control.space.*",
  "control.radius.*",
  "control.type.*",
  "requiredStates",
  "data-control-component",
  "linkedPreviewSection",
  "MUST NOT contain Cursor-specific behavior",
  "preview/static/",
];

function collectTsxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectTsxFiles(full));
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

describe("P2.1-pre-0 — React binding design rule (B1)", () => {
  it("documents binding rules in global-control-design-rules.md", () => {
    expect(existsSync(rulesPath), `missing rules file: ${rulesPath}`).toBe(true);
    const content = readFileSync(rulesPath, "utf8");
    for (const phrase of REQUIRED_RULE_PHRASES) {
      expect(content.includes(phrase), `rules must mention: ${phrase}`).toBe(true);
    }
  });

  it("src/**/*.tsx has no hardcoded color literals or forbidden imports", () => {
    const files = collectTsxFiles(srcRoot);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const rel = relative(pkgRoot, file);

      for (const { name, pattern } of HARDCODED_COLOR_PATTERNS) {
        expect(pattern.test(content), `${rel} must not contain ${name}`).toBe(false);
      }

      for (const snippet of FORBIDDEN_IMPORT_SNIPPETS) {
        expect(content.includes(snippet), `${rel} must not reference ${snippet}`).toBe(false);
      }
    }
  });
});
