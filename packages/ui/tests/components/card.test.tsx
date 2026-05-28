import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardSurface, CardStatus } from "../../src/components/Card/CardSurface";

describe("Card", () => {
  it("renders CardSurface with catalog id", () => {
    render(<CardSurface>Content</CardSurface>);
    expect(screen.getByText("Content")).toHaveAttribute(
      "data-control-component",
      "control.component.card.surface",
    );
  });

  it("renders CardStatus required states", () => {
    render(<CardStatus state="error" title="Error" message="Failed" />);
    const card = screen.getByText("Error").closest("[data-control-component]");
    expect(card).toHaveAttribute("data-control-component", "control.component.card.status");
    expect(card).toHaveAttribute("data-state", "error");
  });
});
