import type { HTMLAttributes, ReactNode } from "react";
import { cssVar } from "../control-props";

export interface ModuleSectionProps extends HTMLAttributes<HTMLDivElement> {
  header: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export function ModuleSection({
  header,
  children,
  disabled = false,
  loading = false,
  style,
  ...rest
}: ModuleSectionProps) {
  const dataState = loading ? "loading" : disabled ? "disabled" : undefined;

  return (
    <section
      data-control-component="control.component.moduleSection"
      data-state={dataState}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: cssVar("control.space.md"),
        padding: cssVar("control.space.md"),
        background: cssVar("control.color.surface"),
        border: `1px solid ${cssVar("control.color.border")}`,
        borderRadius: cssVar("control.radius.lg"),
        opacity: disabled ? cssVar("control.opacity.disabled") : "1",
        ...style,
      }}
      {...rest}
    >
      {header}
      {children}
    </section>
  );
}
