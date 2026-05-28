import type { HTMLAttributes } from "react";
import { cssVar } from "../control-props";

export interface BadgeRiskProps extends HTMLAttributes<HTMLSpanElement> {
  level: "normal" | "elevated" | "destructive";
  label: string;
}

export function BadgeRisk({ level, label, style, ...rest }: BadgeRiskProps) {
  const colorKey =
    level === "destructive"
      ? "control.color.danger"
      : level === "elevated"
        ? "control.color.warn"
        : "control.color.textMuted";

  return (
    <span
      data-control-component="control.component.badge.risk"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${cssVar("control.space.xs")} ${cssVar("control.space.sm")}`,
        borderRadius: cssVar("control.radius.sm"),
        fontSize: cssVar("control.type.caption.size"),
        fontWeight: cssVar("control.type.label.weight"),
        color: cssVar("control.color.text"),
        background: cssVar(colorKey),
        ...style,
      }}
      {...rest}
    >
      {label}
    </span>
  );
}
