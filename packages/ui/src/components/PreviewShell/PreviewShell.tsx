import type { HTMLAttributes, ReactNode } from "react";
import { cssVar } from "../control-props";

export interface PreviewShellProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  nav?: ReactNode;
}

export function PreviewShell({ children, nav, style, ...rest }: PreviewShellProps) {
  return (
    <div
      data-preview-shell="global-control-design-review"
      style={{
        minHeight: "100vh",
        background: cssVar("control.color.bg"),
        color: cssVar("control.color.text"),
        ...style,
      }}
      {...rest}
    >
      <div
        role="status"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: cssVar("control.space.sm"),
          background: cssVar("control.color.warn"),
          color: cssVar("control.color.bg"),
          fontSize: cssVar("control.type.label.size"),
          fontWeight: cssVar("control.type.label.weight"),
          textAlign: "center",
        }}
      >
        NOT PRODUCT UI — Global Control Design Review Only
      </div>
      <header
        style={{
          padding: cssVar("control.space.lg"),
          maxWidth: cssVar("control.layout.reviewColumnMax"),
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: cssVar("control.type.headline.size"),
            fontWeight: cssVar("control.type.headline.weight"),
            margin: 0,
          }}
        >
          Global Control Design Review Gallery
        </h1>
        <p
          style={{
            fontSize: cssVar("control.type.body.size"),
            color: cssVar("control.color.textMuted"),
            lineHeight: cssVar("control.type.body.lineHeight"),
          }}
        >
          Not Bridge Mobile App — review artifact for global control UI rules.
        </p>
        {nav}
      </header>
      <main style={{ padding: cssVar("control.space.lg") }}>{children}</main>
    </div>
  );
}
