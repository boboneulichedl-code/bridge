import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgeCount } from "../../src/components/Badge/BadgeCount";
import { BadgeRisk } from "../../src/components/Badge/BadgeRisk";
import { BadgeSubsystem } from "../../src/components/Badge/BadgeSubsystem";

describe("Badge", () => {
  it("renders risk badge", () => {
    render(<BadgeRisk level="destructive" label="destructive" />);
    expect(screen.getByText("destructive")).toHaveAttribute(
      "data-control-component",
      "control.component.badge.risk",
    );
  });

  it("renders subsystem badge", () => {
    render(<BadgeSubsystem label="Agent" />);
    expect(screen.getByText("Agent")).toHaveAttribute(
      "data-control-component",
      "control.component.badge.subsystem",
    );
  });

  it("renders count badge empty state", () => {
    render(<BadgeCount count={0} />);
    expect(screen.getByText("—")).toHaveAttribute("data-control-component", "control.component.badge.count");
    expect(screen.getByText("—")).toHaveAttribute("data-state", "empty");
  });
});
