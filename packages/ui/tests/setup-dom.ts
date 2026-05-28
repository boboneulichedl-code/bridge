import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { applyControlTokens, applyElevationShadows } from "../src/theme/apply-control-tokens";

applyControlTokens(document.documentElement);
applyElevationShadows(document.documentElement);

afterEach(() => {
  cleanup();
});
