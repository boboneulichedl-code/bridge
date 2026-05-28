import {
  BadgeRisk,
  BadgeSubsystem,
  ModuleSection,
  ModuleSectionHeader,
  cssVar,
} from "@bridge/ui";

const STACK = [
  { title: "Permission Gate", risk: "elevated" as const },
  { title: "Status", risk: "normal" as const },
  { title: "Terminal", risk: "destructive" as const, subsystem: true },
  { title: "Version", risk: "normal" as const },
];

export function S11ModuleStackBasics() {
  return (
    <section className="preview-section" id="S11" data-section="S11">
      <h2 className="preview-section__title">S11 — Module Stack Basics</h2>
      <p className="preview-section__purpose">
        Vertical module stack with cross-cutting separation (subset — full moduleOrder deferred to
        P2.1a).
      </p>
      <div className="preview-grid">
        {STACK.map(({ title, risk, subsystem }) => (
          <ModuleSection
            key={title}
            header={
              <ModuleSectionHeader
                title={title}
                badges={
                  <>
                    <BadgeRisk level={risk} label={risk} />
                    {subsystem ? <BadgeSubsystem /> : null}
                  </>
                }
              />
            }
          >
            <div
              style={{
                fontSize: cssVar("control.type.body.size"),
                color: cssVar("control.color.textMuted"),
              }}
            >
              Module body placeholder
            </div>
          </ModuleSection>
        ))}
        <div className="preview-overlay-label">
          Cross-cutting overlay (confirmation / result / error) — outside stack
        </div>
        <div className="preview-forbidden">Monolithic page forbidden</div>
      </div>
    </section>
  );
}
