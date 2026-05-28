import { Button, cssVar } from "@bridge/ui";

const VARIANTS = ["primary", "secondary", "danger"] as const;

export function S05ButtonStates() {
  return (
    <section className="preview-section" id="S05" data-section="S05">
      <h2 className="preview-section__title">S05 — Button / Action States</h2>
      <p className="preview-section__purpose">
        Interactive controls in all relevant states. Min touch height:{" "}
        {cssVar("control.touch.min")} (48dp).
      </p>
      <div className="preview-grid">
        {VARIANTS.map((variant) => (
          <div key={variant}>
            <div
              style={{
                fontSize: cssVar("control.type.label.size"),
                color: cssVar("control.color.textMuted"),
                marginBottom: cssVar("control.space.sm"),
              }}
            >
              {variant}
            </div>
            <div className="preview-row">
              <Button variant={variant}>Default</Button>
              <Button variant={variant} disabled>
                Disabled
              </Button>
              <Button variant={variant} loading>
                Loading
              </Button>
            </div>
          </div>
        ))}
        <div className="preview-row">
          <Button variant="primary">Accent primary</Button>
          <Button variant="danger">Destructive primary</Button>
        </div>
      </div>
    </section>
  );
}
