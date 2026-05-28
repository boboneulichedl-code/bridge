import {
  CONTROL_ELEVATION_SHADOWS,
  CONTROL_TOKENS,
  type ControlElevationLevel,
  type ControlTokenKey,
} from "../generated/control-tokens";

export function tokenKeyToCssVar(key: ControlTokenKey): string {
  return `--${key.replace(/\./g, "-")}`;
}

export function elevationShadowToCssVar(level: ControlElevationLevel): string {
  return `--control-shadow-${level}`;
}

export function controlTokensStylesheet(): string {
  const tokenLines = Object.entries(CONTROL_TOKENS).map(
    ([key, value]) => `  ${tokenKeyToCssVar(key as ControlTokenKey)}: ${value};`,
  );
  const shadowLines = Object.entries(CONTROL_ELEVATION_SHADOWS).map(
    ([level, value]) => `  ${elevationShadowToCssVar(level as ControlElevationLevel)}: ${value};`,
  );
  return `:root {\n${[...tokenLines, ...shadowLines].join("\n")}\n}\n`;
}

export function applyControlTokens(target: HTMLElement = document.documentElement): void {
  for (const [key, value] of Object.entries(CONTROL_TOKENS)) {
    target.style.setProperty(tokenKeyToCssVar(key as ControlTokenKey), value);
  }
}

export function applyElevationShadows(target: HTMLElement = document.documentElement): void {
  for (const [level, value] of Object.entries(CONTROL_ELEVATION_SHADOWS)) {
    target.style.setProperty(
      elevationShadowToCssVar(level as ControlElevationLevel),
      value,
    );
  }
}
