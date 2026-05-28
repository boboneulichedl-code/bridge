import { CardSurface, cssVar, shadowVar } from "@bridge/ui";

export function S04RadiusSurface() {
  return (
    <section className="preview-section" id="S04" data-section="S04">
      <h2 className="preview-section__title">S04 — Radius / Surface</h2>
      <p className="preview-section__purpose">Surface hierarchy and elevation.</p>
      <div className="preview-grid">
        <CardSurface elevated>Card — radius.lg, shadow.raised</CardSurface>
        <div
          style={{
            padding: cssVar("control.space.md"),
            background: cssVar("control.color.surface"),
            borderRadius: cssVar("control.radius.xl"),
            boxShadow: shadowVar("overlay"),
            border: `1px solid ${cssVar("control.color.border")}`,
          }}
        >
          Dialog mock — radius.xl, shadow.overlay
        </div>
        <div
          style={{
            padding: cssVar("control.space.md"),
            background: cssVar("control.color.bg"),
            border: `1px solid ${cssVar("control.color.border")}`,
            borderRadius: cssVar("control.radius.md"),
          }}
        >
          Flat surface — border subtle
        </div>
        <div
          style={{
            padding: cssVar("control.space.md"),
            background: cssVar("control.color.surface"),
            border: `2px solid ${cssVar("control.color.textMuted")}`,
            borderRadius: cssVar("control.radius.md"),
          }}
        >
          Border strong variant
        </div>
      </div>
    </section>
  );
}
