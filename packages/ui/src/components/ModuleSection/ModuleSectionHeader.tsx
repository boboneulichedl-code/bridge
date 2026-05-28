import type { HTMLAttributes, ReactNode } from "react";
import { cssVar } from "../control-props";

export interface ModuleSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  disabled?: boolean;
  badges?: ReactNode;
}

export function ModuleSectionHeader({
  title,
  disabled = false,
  badges,
  style,
  ...rest
}: ModuleSectionHeaderProps) {
  return (
    <div
      data-control-component="control.component.moduleSection.header"
      data-state={disabled ? "disabled" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: cssVar("control.space.sm"),
        paddingBottom: cssVar("control.space.sm"),
        borderBottom: `1px solid ${cssVar("control.color.border")}`,
        opacity: disabled ? cssVar("control.opacity.disabled") : "1",
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          fontSize: cssVar("control.type.title.size"),
          fontWeight: cssVar("control.type.title.weight"),
          color: cssVar("control.color.text"),
        }}
      >
        {title}
      </span>
      {badges ? (
        <div style={{ display: "flex", gap: cssVar("control.space.xs") }}>{badges}</div>
      ) : null}
    </div>
  );
}
