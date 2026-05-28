import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTROL_TOKENS, CONTROL_TOKEN_KEYS } from "../src/generated/control-tokens";
import { tokenKeyToCssVar } from "../src/theme/apply-control-tokens";

const repoRoot = join(__dirname, "..", "..", "..");
const tokensPath = join(repoRoot, "docs/global-design/control-rules/tokens/control.tokens.json");
const cssPath = join(__dirname, "..", "src/generated/control-tokens.css");

function expectedTokenMap(): Record<string, string> {
  const raw = JSON.parse(readFileSync(tokensPath, "utf8")) as {
    meta: { defaultColorPresetId: string };
    colorPresets: Record<string, { colors: Record<string, string> }>;
    tokens: Record<string, string>;
  };
  const presetId = raw.meta.defaultColorPresetId;
  return { ...raw.colorPresets[presetId].colors, ...raw.tokens };
}

describe("control tokens generated output", () => {
  it("matches control.tokens.json default preset colors and flat tokens", () => {
    const expected = expectedTokenMap();
    expect(Object.keys(CONTROL_TOKENS).length).toBe(Object.keys(expected).length);
    for (const [key, value] of Object.entries(expected)) {
      expect(CONTROL_TOKENS[key as keyof typeof CONTROL_TOKENS]).toBe(value);
    }
  });

  it("exposes sorted CONTROL_TOKEN_KEYS aligned with CONTROL_TOKENS", () => {
    expect(CONTROL_TOKEN_KEYS.length).toBe(Object.keys(CONTROL_TOKENS).length);
    const sorted = [...CONTROL_TOKEN_KEYS].sort((a, b) => a.localeCompare(b));
    expect([...CONTROL_TOKEN_KEYS]).toEqual(sorted);
  });

  it("writes CSS variables for every token key", () => {
    const css = readFileSync(cssPath, "utf8");
    for (const [key, value] of Object.entries(CONTROL_TOKENS)) {
      expect(css).toContain(`${tokenKeyToCssVar(key as keyof typeof CONTROL_TOKENS)}: ${value};`);
    }
  });
});
