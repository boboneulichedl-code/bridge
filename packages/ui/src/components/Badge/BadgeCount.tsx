import type { HTMLAttributes } from "react";
import { cssVar } from "../control-props";

export interface BadgeCountProps extends HTMLAttributes<HTMLSpanElement> {
  count?: number;
  tone?: "danger" | "warn" | "muted";
}

export function BadgeCount({
  count,
  tone = "muted",
  style,
  ...rest
}: BadgeCountProps) {
  const isEmpty = count === undefined || count === 0;
  const toneKey =
    tone === "danger"
      ? "control.color.danger"
      : tone === "warn"
        ? "control.color.warn"
        : "control.color.textMuted";

  return (
    <span
      data-control-component="control.component.badge.count"
      data-state={isEmpty ? "empty" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: cssVar("control.space.lg"),
        padding: `${cssVar("control.space.xs")} ${cssVar("control.space.sm")}`,
        borderRadius: cssVar("control.radius.sm"),
        fontSize: cssVar("control.type.caption.size"),
        fontWeight: cssVar("control.type.label.weight"),
        color: cssVar("control.color.text"),
        background: cssVar("control.color.surface"),
        border: `1px solid ${cssVar(toneKey)}`,
        opacity: isEmpty ? cssVar("control.opacity.disabled") : "1",
        ...style,
      }}
      {...rest}
    >
      {isEmpty ? "—" : count}
    </span>
  );
}
