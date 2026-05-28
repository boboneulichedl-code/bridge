import { CONTROL_TOKENS, type ControlTokenKey } from "../generated/control-tokens";

export function tokenKeyToCssVar(key: ControlTokenKey): string {
  return `--${key.replace(/\./g, "-")}`;
}

export function controlTokensStylesheet(): string {
  const lines = Object.entries(CONTROL_TOKENS).map(
    ([key, value]) => `  ${tokenKeyToCssVar(key as ControlTokenKey)}: ${value};`,
  );
  return `:root {\n${lines.join("\n")}\n}\n`;
}

export function applyControlTokens(target: HTMLElement = document.documentElement): void {
  for (const [key, value] of Object.entries(CONTROL_TOKENS)) {
    target.style.setProperty(tokenKeyToCssVar(key as ControlTokenKey), value);
  }
}
