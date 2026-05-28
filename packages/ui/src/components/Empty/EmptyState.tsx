import type { HTMLAttributes, ReactNode } from "react";
import { cssVar } from "../control-props";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action, style, ...rest }: EmptyStateProps) {
  return (
    <div
      data-control-component="control.component.list.empty"
      data-state="empty"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: cssVar("control.space.sm"),
        padding: cssVar("control.space.lg"),
        background: cssVar("control.color.surface"),
        border: `1px dashed ${cssVar("control.color.border")}`,
        borderRadius: cssVar("control.radius.lg"),
        textAlign: "center",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          fontSize: cssVar("control.type.title.size"),
          fontWeight: cssVar("control.type.title.weight"),
          color: cssVar("control.color.textMuted"),
        }}
      >
        {title}
      </div>
      {hint ? (
        <div
          style={{
            fontSize: cssVar("control.type.body.size"),
            color: cssVar("control.color.textMuted"),
            lineHeight: cssVar("control.type.body.lineHeight"),
          }}
        >
          {hint}
        </div>
      ) : null}
      {action}
    </div>
  );
}
