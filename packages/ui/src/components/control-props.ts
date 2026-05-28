import type { CSSProperties, ReactNode } from "react";
import type { ControlTokenKey } from "../generated/control-tokens";

export type ControlComponentId =
  | "control.component.button.primary"
  | "control.component.button.secondary"
  | "control.component.button.danger"
  | "control.component.card.surface"
  | "control.component.card.status"
  | "control.component.moduleSection"
  | "control.component.moduleSection.header"
  | "control.component.badge.risk"
  | "control.component.badge.subsystem"
  | "control.component.badge.count"
  | "control.component.skeleton.block"
  | "control.component.list.empty";

export type ControlState =
  | "default"
  | "disabled"
  | "loading"
  | "empty"
  | "error"
  | "unreachable";

export interface ControlComponentProps {
  "data-control-component": ControlComponentId;
  "data-state"?: ControlState;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function cssVar(key: ControlTokenKey): string {
  return `var(--${key.replace(/\./g, "-")})`;
}

export function shadowVar(
  level: "none" | "raised" | "overlay" | "modal",
): string {
  return `var(--control-shadow-${level})`;
}
