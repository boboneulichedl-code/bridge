import { CardSurface, cssVar } from "@bridge/ui";

const SPACES = [
  { key: "xs", token: "control.space.xs" },
  { key: "sm", token: "control.space.sm" },
  { key: "md", token: "control.space.md" },
  { key: "lg", token: "control.space.lg" },
  { key: "xl", token: "control.space.xl" },
] as const;

export function S03Spacing() {
  return (
    <section className="preview-section" id="S03" data-section="S03">
      <h2 className="preview-section__title">S03 — Spacing</h2>
      <p className="preview-section__purpose">8px grid and module spacing.</p>
      <div className="preview-grid">
        {SPACES.map(({ key, token }) => (
          <div key={key}>
            <div
              style={{
                fontSize: cssVar("control.type.caption.size"),
                color: cssVar("control.color.textMuted"),
                marginBottom: cssVar("control.space.xs"),
              }}
            >
              {key} ({token})
            </div>
            <div className="preview-spacing-bar" style={{ width: cssVar(token) }} />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: cssVar("control.space.lg") }}>
          <CardSurface>Module A — gap lg</CardSurface>
          <CardSurface>Module B — inner padding md (default)</CardSurface>
        </div>
      </div>
    </section>
  );
}
