import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../src/components/Empty/EmptyState";
import { SkeletonBlock } from "../../src/components/Skeleton/SkeletonBlock";

describe("Skeleton and Empty", () => {
  it("renders SkeletonBlock loading state", () => {
    render(<SkeletonBlock lines={2} />);
    const skeleton = document.querySelector(
      "[data-control-component='control.component.skeleton.block']",
    );
    expect(skeleton).toHaveAttribute("data-state", "loading");
  });

  it("renders EmptyState", () => {
    render(<EmptyState title="No data" hint="Refresh" />);
    const root = screen.getByText("No data").closest("[data-control-component]");
    expect(root).toHaveAttribute("data-control-component", "control.component.list.empty");
    expect(root).toHaveAttribute("data-state", "empty");
  });
});
