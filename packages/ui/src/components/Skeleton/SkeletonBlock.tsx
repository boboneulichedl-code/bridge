import type { HTMLAttributes } from "react";
import { cssVar } from "../control-props";

export interface SkeletonBlockProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function SkeletonBlock({ lines = 3, style, ...rest }: SkeletonBlockProps) {
  return (
    <div
      data-control-component="control.component.skeleton.block"
      data-state="loading"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: cssVar("control.space.sm"),
        ...style,
      }}
      {...rest}
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          style={{
            height: cssVar("control.space.md"),
            borderRadius: cssVar("control.radius.md"),
            background: cssVar("control.color.surface"),
            border: `1px solid ${cssVar("control.color.border")}`,
            opacity: cssVar("control.opacity.disabled"),
            width: index === lines - 1 ? "70%" : "100%",
          }}
        />
      ))}
    </div>
  );
}
