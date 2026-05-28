import { describe, expect, it } from "vitest";
import {
  P0_ACTION_IDS,
  P0_ROLLBACK_AVAILABLE,
  CURSOR_API_SPEC,
  CURSOR_API_ROUTES,
  CURSOR_ACTION_ROUTE,
  CURSOR_ERROR_HTTP_STATUS,
  isCursorActionId,
} from "../src/cursor-contract";

describe("Step 2 — cursor-contract", () => {
  it("defines exactly 10 P0 action IDs", () => {
    expect(P0_ACTION_IDS).toHaveLength(10);
    expect(P0_ACTION_IDS).toContain("cursor.ide.status.get");
    expect(P0_ACTION_IDS).toContain("cursor.agent.prompt.send");
  });

  it("P0_ROLLBACK_AVAILABLE is true after P0.1a", () => {
    expect(P0_ROLLBACK_AVAILABLE).toBe(true);
  });

  it("maps each action to a /api/v1/cursor route", () => {
    for (const id of P0_ACTION_IDS) {
      expect(CURSOR_ACTION_ROUTE[id]).toMatch(new RegExp(`^${CURSOR_API_SPEC}/`));
    }
  });

  it("agent prompt uses cursor adapter route not legacy /prompt", () => {
    expect(CURSOR_API_ROUTES.agentPrompt).toBe("/api/v1/cursor/agent/prompt");
    expect(CURSOR_API_ROUTES.agentPrompt).not.toBe("/api/v1/prompt");
  });

  it("snapshot restore route exists for P0.1 stub", () => {
    expect(CURSOR_API_ROUTES.snapshotRestore).toBe("/api/v1/cursor/snapshots");
  });

  it("ui-modules route is part of the cursor API contract", () => {
    expect(CURSOR_API_ROUTES.uiModules).toBe("/api/v1/cursor/ui-modules");
  });

  it("covers all error codes with HTTP status", () => {
    expect(CURSOR_ERROR_HTTP_STATUS.ROLLBACK_NOT_AVAILABLE).toBe(501);
    expect(CURSOR_ERROR_HTTP_STATUS.CONFIRMATION_REQUIRED).toBe(428);
    expect(Object.keys(CURSOR_ERROR_HTTP_STATUS)).toHaveLength(10);
    expect(CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_NOT_FOUND).toBe(404);
    expect(CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_UNSUPPORTED).toBe(400);
  });

  it("isCursorActionId rejects unknown actions", () => {
    expect(isCursorActionId("cursor.ide.status.get")).toBe(true);
    expect(isCursorActionId("cursor.ide.fs.delete")).toBe(false);
    expect(isCursorActionId("bridge.prompt")).toBe(false);
  });
});
