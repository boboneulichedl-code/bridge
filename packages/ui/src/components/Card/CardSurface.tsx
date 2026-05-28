import type { HTMLAttributes, ReactNode } from "react";
import type { ControlTokenKey } from "../../generated/control-tokens";
import { cssVar, shadowVar } from "../control-props";

export interface CardSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  elevated?: boolean;
}

export function CardSurface({
  children,
  elevated = true,
  style,
  ...rest
}: CardSurfaceProps) {
  return (
    <div
      data-control-component="control.component.card.surface"
      style={{
        background: cssVar("control.color.surface"),
        border: `1px solid ${cssVar("control.color.border")}`,
        borderRadius: cssVar("control.radius.lg"),
        padding: cssVar("control.space.md"),
        boxShadow: elevated ? shadowVar("raised") : shadowVar("none"),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CardStatusState =
  | "loading"
  | "empty"
  | "error"
  | "disabled"
  | "unreachable"
  | "default";

export interface CardStatusProps extends HTMLAttributes<HTMLDivElement> {
  state?: CardStatusState;
  title: string;
  message?: string;
}

const stateAccent: Record<CardStatusState, ControlTokenKey> = {
  default: "control.color.accent",
  loading: "control.color.textMuted",
  empty: "control.color.textMuted",
  error: "control.color.danger",
  disabled: "control.color.textMuted",
  unreachable: "control.color.warn",
};

export function CardStatus({
  state = "default",
  title,
  message,
  style,
  ...rest
}: CardStatusProps) {
  const dataState = state === "default" ? undefined : state;

  return (
    <div
      data-control-component="control.component.card.status"
      data-state={dataState}
      style={{
        background: cssVar("control.color.surfaceElevated"),
        border: `1px solid ${cssVar("control.color.border")}`,
        borderLeft: `4px solid ${cssVar(stateAccent[state])}`,
        borderRadius: cssVar("control.radius.lg"),
        padding: cssVar("control.space.md"),
        boxShadow: shadowVar("raised"),
        opacity: state === "disabled" ? cssVar("control.opacity.disabled") : "1",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          fontSize: cssVar("control.type.title.size"),
          fontWeight: cssVar("control.type.title.weight"),
          color: cssVar("control.color.text"),
          marginBottom: cssVar("control.space.xs"),
        }}
      >
        {title}
      </div>
      {message ? (
        <div
          style={{
            fontSize: cssVar("control.type.body.size"),
            color: cssVar("control.color.textMuted"),
            lineHeight: cssVar("control.type.body.lineHeight"),
          }}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
