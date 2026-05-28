import { cssVar } from "@bridge/ui";

const COLOR_KEYS = [
  "control.color.bg",
  "control.color.surface",
  "control.color.surfaceElevated",
  "control.color.text",
  "control.color.textMuted",
  "control.color.accent",
  "control.color.accentMuted",
  "control.color.ok",
  "control.color.warn",
  "control.color.danger",
  "control.color.border",
  "control.color.focus",
] as const;

export function S01ColorTokens() {
  return (
    <section className="preview-section" id="S01" data-section="S01">
      <h2 className="preview-section__title">S01 — Color / Token</h2>
      <p className="preview-section__purpose">
        Semantic color roles and token IDs — Review Defaults (not CoreAI brand).
      </p>
      <div className="preview-token-grid">
        {COLOR_KEYS.map((key) => (
          <div key={key} className="preview-token-swatch">
            <div
              className="preview-token-swatch__color"
              style={{ background: cssVar(key) }}
            />
            <div className="preview-token-swatch__label">{key}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
