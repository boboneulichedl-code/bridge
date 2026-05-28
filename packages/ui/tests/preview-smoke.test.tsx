import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../preview/App";

describe("preview gallery smoke", () => {
  it("renders NOT PRODUCT UI banner and all required sections", () => {
    render(<App />);
    expect(
      screen.getByText("NOT PRODUCT UI — Global Control Design Review Only"),
    ).toBeInTheDocument();
    for (const id of ["S01", "S02", "S03", "S04", "S05", "S06", "S11", "S15"]) {
      expect(document.getElementById(id), `missing section #${id}`).not.toBeNull();
    }
  });
});
