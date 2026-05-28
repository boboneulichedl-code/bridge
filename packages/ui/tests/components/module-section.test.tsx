import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleSection } from "../../src/components/ModuleSection/ModuleSection";
import { ModuleSectionHeader } from "../../src/components/ModuleSection/ModuleSectionHeader";

describe("ModuleSection", () => {
  it("renders section and header with catalog ids", () => {
    render(
      <ModuleSection
        loading
        header={<ModuleSectionHeader title="Status" />}
      >
        Body
      </ModuleSection>,
    );
    expect(screen.getByText("Body").closest("section")).toHaveAttribute(
      "data-control-component",
      "control.component.moduleSection",
    );
    expect(screen.getByText("Body").closest("section")).toHaveAttribute("data-state", "loading");
    expect(screen.getByText("Status").closest("[data-control-component]")).toHaveAttribute(
      "data-control-component",
      "control.component.moduleSection.header",
    );
  });

  it("renders disabled header state", () => {
    render(<ModuleSectionHeader title="Gate" disabled />);
    expect(screen.getByText("Gate").closest("[data-control-component]")).toHaveAttribute(
      "data-state",
      "disabled",
    );
  });
});
