import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { cssVar, shadowVar, type ControlComponentId } from "../control-props";

export type ButtonVariant = "primary" | "secondary" | "danger";

const CATALOG_IDS: Record<ButtonVariant, ControlComponentId> = {
  primary: "control.component.button.primary",
  secondary: "control.component.button.secondary",
  danger: "control.component.button.danger",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const dataState = loading ? "loading" : isDisabled ? "disabled" : "default";

  const variantStyles: Record<ButtonVariant, CSSProperties> = {
    primary: {
      background: cssVar("control.color.accent"),
      color: cssVar("control.color.text"),
      border: `1px solid ${cssVar("control.color.accent")}`,
    },
    secondary: {
      background: cssVar("control.color.surface"),
      color: cssVar("control.color.text"),
      border: `1px solid ${cssVar("control.color.border")}`,
    },
    danger: {
      background: cssVar("control.color.danger"),
      color: cssVar("control.color.text"),
      border: `1px solid ${cssVar("control.color.danger")}`,
    },
  };

  return (
    <button
      type="button"
      data-control-component={CATALOG_IDS[variant]}
      data-state={dataState}
      disabled={isDisabled}
      style={{
        minHeight: cssVar("control.touch.min"),
        padding: `${cssVar("control.space.sm")} ${cssVar("control.space.md")}`,
        borderRadius: cssVar("control.radius.md"),
        fontSize: cssVar("control.type.label.size"),
        fontWeight: cssVar("control.type.label.weight"),
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? cssVar("control.opacity.disabled") : "1",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: cssVar("control.space.sm"),
        boxShadow: shadowVar("none"),
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            style={{
              width: cssVar("control.space.md"),
              height: cssVar("control.space.md"),
              borderRadius: cssVar("control.radius.sm"),
              border: `2px solid ${cssVar("control.color.textMuted")}`,
              borderTopColor: cssVar("control.color.text"),
              display: "inline-block",
            }}
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
