import type { HTMLAttributes, ReactNode } from "react";
import { cssVar } from "../control-props";

export interface MobileFrameProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  widthPx?: number;
  heightPx?: number;
  safeTopPx?: number;
  safeBottomPx?: number;
  bottomActionZonePx?: number;
}

export function MobileFrame({
  children,
  widthPx = 412,
  heightPx = 915,
  safeTopPx = 24,
  safeBottomPx = 34,
  bottomActionZonePx = 72,
  style,
  ...rest
}: MobileFrameProps) {
  return (
    <div
      data-preview-frame="device-profile-default-a"
      style={{
        width: `${widthPx}px`,
        maxWidth: "100%",
        height: `${heightPx}px`,
        margin: "0 auto",
        border: `2px solid ${cssVar("control.color.border")}`,
        borderRadius: cssVar("control.radius.xl"),
        background: cssVar("control.color.bg"),
        boxShadow: `var(--control-shadow-overlay)`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          height: `${safeTopPx}px`,
          flexShrink: 0,
          borderBottom: `1px dashed ${cssVar("control.color.border")}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: cssVar("control.type.caption.size"),
          color: cssVar("control.color.textMuted"),
        }}
      >
        safe top {safeTopPx}px
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: cssVar("control.space.md"),
        }}
      >
        {children}
      </div>
      <div
        style={{
          height: `${bottomActionZonePx + safeBottomPx}px`,
          flexShrink: 0,
          borderTop: `1px dashed ${cssVar("control.color.border")}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: cssVar("control.space.xs"),
          fontSize: cssVar("control.type.caption.size"),
          color: cssVar("control.color.textMuted"),
          paddingBottom: `${safeBottomPx}px`,
        }}
      >
        <span>bottom action zone {bottomActionZonePx}px</span>
        <span>safe bottom {safeBottomPx}px</span>
      </div>
    </div>
  );
}
