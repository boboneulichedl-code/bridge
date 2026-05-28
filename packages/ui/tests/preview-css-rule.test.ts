import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cssPath = join(__dirname, "..", "preview/styles/preview.css");

const HARDCODED_COLOR_PATTERNS = [
  { name: "hex color", pattern: /#([0-9a-fA-F]{3,8})\b/ },
  { name: "rgb(", pattern: /\brgb\s*\(/ },
  { name: "hsl(", pattern: /\bhsl\s*\(/ },
  { name: "rgba(", pattern: /\brgba\s*\(/ },
];

describe("preview CSS binding rule", () => {
  it("preview.css has no hardcoded color literals", () => {
    const content = readFileSync(cssPath, "utf8");
    for (const { name, pattern } of HARDCODED_COLOR_PATTERNS) {
      expect(pattern.test(content), `preview.css must not contain ${name}`).toBe(false);
    }
    expect(content).toContain("var(--control-");
  });
});
