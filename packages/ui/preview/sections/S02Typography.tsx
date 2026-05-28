import { cssVar } from "@bridge/ui";

const SAMPLES = [
  { label: "caption", size: "control.type.caption.size", weight: "control.type.caption.weight" },
  { label: "body", size: "control.type.body.size", weight: "control.type.body.weight" },
  { label: "label", size: "control.type.label.size", weight: "control.type.label.weight" },
  { label: "title", size: "control.type.title.size", weight: "control.type.title.weight" },
  { label: "headline", size: "control.type.headline.size", weight: "control.type.headline.weight" },
] as const;

export function S02Typography() {
  return (
    <section className="preview-section" id="S02" data-section="S02">
      <h2 className="preview-section__title">S02 — Typography</h2>
      <p className="preview-section__purpose">Typography scale and hierarchy.</p>
      <div className="preview-grid">
        {SAMPLES.map(({ label, size, weight }) => (
          <div
            key={label}
            style={{
              fontSize: cssVar(size),
              fontWeight: cssVar(weight),
              color: cssVar("control.color.text"),
              lineHeight: cssVar("control.type.body.lineHeight"),
            }}
          >
            {label} — The quick brown fox
          </div>
        ))}
        <div
          style={{
            fontFamily: cssVar("control.type.mono.family"),
            fontSize: cssVar("control.type.mono.size"),
            color: cssVar("control.color.textMuted"),
          }}
        >
          mono — actionId: a1b2c3d4e5f6
        </div>
      </div>
    </section>
  );
}
