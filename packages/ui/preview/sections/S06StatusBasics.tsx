import {
  BadgeCount,
  CardStatus,
  EmptyState,
  SkeletonBlock,
  cssVar,
} from "@bridge/ui";

const STATUS_STATES = [
  { state: "loading" as const, title: "Loading", message: "Fetching adapter status…" },
  { state: "empty" as const, title: "Empty", message: "No data available." },
  { state: "error" as const, title: "Error", message: "Connection failed." },
  { state: "disabled" as const, title: "Disabled", message: "Module unavailable." },
  { state: "unreachable" as const, title: "Unreachable", message: "Host not responding." },
];

export function S06StatusBasics() {
  return (
    <section className="preview-section" id="S06" data-section="S06">
      <h2 className="preview-section__title">S06 — Status Basics</h2>
      <p className="preview-section__purpose">
        Foundation component states (subset — full 17-state gallery deferred to P2.1a).
      </p>
      <div className="preview-grid">
        <div>
          <div
            style={{
              fontSize: cssVar("control.type.label.size"),
              marginBottom: cssVar("control.space.sm"),
            }}
          >
            SkeletonBlock
          </div>
          <SkeletonBlock />
        </div>
        <EmptyState title="No items" hint="Try refreshing or check connection." />
        <div className="preview-row">
          <BadgeCount count={0} />
          <BadgeCount count={3} tone="warn" />
          <BadgeCount count={12} tone="danger" />
        </div>
        {STATUS_STATES.map(({ state, title, message }) => (
          <CardStatus key={state} state={state} title={title} message={message} />
        ))}
      </div>
    </section>
  );
}
