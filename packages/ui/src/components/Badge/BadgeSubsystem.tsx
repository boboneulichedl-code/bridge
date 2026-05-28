import type { HTMLAttributes } from "react";
import { cssVar } from "../control-props";

export interface BadgeSubsystemProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

export function BadgeSubsystem({
  label = "Subsystem",
  style,
  ...rest
}: BadgeSubsystemProps) {
  return (
    <span
      data-control-component="control.component.badge.subsystem"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${cssVar("control.space.xs")} ${cssVar("control.space.sm")}`,
        borderRadius: cssVar("control.radius.sm"),
        fontSize: cssVar("control.type.caption.size"),
        fontWeight: cssVar("control.type.label.weight"),
        color: cssVar("control.color.text"),
        background: cssVar("control.color.surfaceElevated"),
        border: `1px solid ${cssVar("control.color.warn")}`,
        ...style,
      }}
      {...rest}
    >
      {label}
    </span>
  );
}
