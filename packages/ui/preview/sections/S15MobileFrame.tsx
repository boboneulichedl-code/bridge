import { CardStatus, MobileFrame, cssVar } from "@bridge/ui";

export function S15MobileFrame() {
  return (
    <section className="preview-section" id="S15" data-section="S15">
      <h2 className="preview-section__title">S15 — Mobile Frame Basics</h2>
      <p className="preview-section__purpose">
        Reference viewport device-profile-default-a: 412×915 logical px. User-profile CRUD deferred
        to future interactive preview.
      </p>
      <MobileFrame>
        <CardStatus
          state="loading"
          title="Sticky status area"
          message="Scrollable middle content inside frame."
        />
        <div
          style={{
            marginTop: cssVar("control.space.md"),
            fontSize: cssVar("control.type.body.size"),
            color: cssVar("control.color.textMuted"),
          }}
        >
          Frame demonstrates safe areas and bottom action zone labels.
        </div>
      </MobileFrame>
    </section>
  );
}
