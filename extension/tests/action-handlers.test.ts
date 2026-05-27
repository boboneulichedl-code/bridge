import { describe, expect, it } from "vitest";
import {
  EXTENSION_EXECUTOR_ACTION_IDS,
  isExtensionExecutorActionId,
  isTerminalCommandAllowed,
  isWorkbenchCommandAllowed,
  normalizeTerminalCommand,
  TERMINAL_COMMAND_ALLOWLIST,
  WORKBENCH_COMMAND_ALLOWLIST,
} from "../src/ide/actions/allowlists";
import { getExtensionActionRejection } from "../src/ide/actions/dispatchPolicy";
import {
  executeActionRequest,
  handleIpcRequest,
  validateExecuteBody,
} from "../src/ide/ipc/handler";
import { IPC_ROUTES } from "../src/ide/ipc/constants";

const ctx = {
  extensionVersion: "2.2.0",
  cursorVersion: "2.3.0",
  port: 3848,
  pid: 12345,
  tokenMatches: (t: string | undefined) => t === "test-token",
};

describe("Step 5 — allowlists", () => {
  it("registers exactly 9 extension executor actions", () => {
    expect(EXTENSION_EXECUTOR_ACTION_IDS).toHaveLength(9);
    expect(isExtensionExecutorActionId("cursor.agent.prompt.send")).toBe(false);
    expect(isExtensionExecutorActionId("cursor.ide.status.get")).toBe(true);
  });

  it("terminal whitelist has 6 exact commands", () => {
    expect(TERMINAL_COMMAND_ALLOWLIST).toHaveLength(6);
    expect(isTerminalCommandAllowed("npm run build")).toBe(true);
    expect(isTerminalCommandAllowed("npm install")).toBe(false);
    expect(normalizeTerminalCommand("git  status")).toBe("git status");
  });

  it("workbench command allowlist blocks unknown commands", () => {
    expect(WORKBENCH_COMMAND_ALLOWLIST.length).toBe(7);
    expect(isWorkbenchCommandAllowed("workbench.view.explorer")).toBe(true);
    expect(isWorkbenchCommandAllowed("workbench.action.deleteAll")).toBe(false);
  });
});

describe("Step 5 — dispatch policy", () => {
  it("rejects action 10 in extension", () => {
    const err = getExtensionActionRejection("cursor.agent.prompt.send");
    expect(err).toMatch(/CLI\/API primary/i);
  });

  it("rejects unknown action ids", () => {
    expect(getExtensionActionRejection("cursor.ide.fs.delete")).toMatch(/Unsupported/);
  });

  it("allows action 1–9 ids at policy layer", () => {
    expect(getExtensionActionRejection("cursor.ide.status.get")).toBeUndefined();
    expect(getExtensionActionRejection("cursor.ide.command.execute")).toBeUndefined();
  });
});

describe("Step 5 — IPC execute routing", () => {
  it("validates execute body", () => {
    expect(validateExecuteBody({}).ok).toBe(false);
    expect(validateExecuteBody({ actionId: "cursor.ide.status.get", requestId: "r1" }).ok).toBe(
      true
    );
  });

  it("routes execute to injected handler", async () => {
    const r = await handleIpcRequest({
      method: "POST",
      pathname: IPC_ROUTES.execute,
      headers: { "x-bridge-ipc-token": "test-token" },
      body: {
        actionId: "cursor.ide.status.get",
        requestId: "req-1",
        params: {},
      },
      ctx: {
        ...ctx,
        executeAction: async (actionId) => ({
          ok: true,
          data: { actionId, stubbed: true },
        }),
      },
    });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, data: { actionId: "cursor.ide.status.get" } });
  });

  it("blocks action 10 via execute without loading vscode handlers", async () => {
    const r = await executeActionRequest(
      {
        actionId: "cursor.agent.prompt.send",
        requestId: "req-agent",
        params: { prompt: "test" },
      },
      ctx
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/CLI\/API primary/i);
  });
});
