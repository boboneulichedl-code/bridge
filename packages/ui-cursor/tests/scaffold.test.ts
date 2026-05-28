import { describe, expect, it } from "vitest";
import {
  UI_CURSOR_IMPLEMENTATION_PHASE,
  UI_CURSOR_PACKAGE_ID,
  UI_RISK_LEVEL_VALUES,
} from "../src/index";

describe("@bridge/ui-cursor scaffold", () => {
  it("exports package identity constants", () => {
    expect(UI_CURSOR_PACKAGE_ID).toBe("@bridge/ui-cursor");
    expect(UI_CURSOR_IMPLEMENTATION_PHASE).toBe("P2");
  });

  it("mirrors ui risk level enum for downstream module work", () => {
    expect(UI_RISK_LEVEL_VALUES).toContain("medium-high");
    expect(UI_RISK_LEVEL_VALUES).toContain("inherit");
  });
});
