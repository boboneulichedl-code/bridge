import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../../src/components/Button/Button";

describe("Button", () => {
  it("renders primary with catalog mapping and default state", () => {
    render(<Button variant="primary">Run</Button>);
    const btn = screen.getByRole("button", { name: "Run" });
    expect(btn).toHaveAttribute("data-control-component", "control.component.button.primary");
    expect(btn).toHaveAttribute("data-state", "default");
  });

  it("renders disabled state", () => {
    render(<Button disabled>Run</Button>);
    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute("data-state", "disabled");
  });

  it("renders danger loading state", () => {
    render(
      <Button loading variant="danger">
        Delete
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn).toHaveAttribute("data-control-component", "control.component.button.danger");
    expect(btn).toHaveAttribute("data-state", "loading");
  });
});
