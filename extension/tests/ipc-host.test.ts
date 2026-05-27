import { describe, expect, it } from "vitest";
import * as path from "node:path";
import {
  buildCapabilitiesResponse,
  buildHealthResponse,
  handleIpcRequest,
  validateExecuteBody,
} from "../src/ide/ipc/handler";
import {
  handshakeContainsForbiddenFields,
  writeIdeControlHandshake,
  readIdeControlHandshake,
} from "../src/ide/ipc/handshake";
import {
  assertTokenStorageOutsideProject,
  ensureIpcToken,
  tokenMatches,
} from "../src/ide/ipc/tokenStore";
import { IPC_HOST, IPC_ROUTES } from "../src/ide/ipc/constants";
import * as fs from "node:fs";
import * as os from "node:os";

const ctx = {
  extensionVersion: "2.2.0",
  cursorVersion: "2.3.0",
  port: 3848,
  pid: 12345,
  tokenMatches: (t: string | undefined) => t === "test-token",
};

describe("Step 4 — IPC handler", () => {
  it("binds to 127.0.0.1 only in constants", () => {
    expect(IPC_HOST).toBe("127.0.0.1");
  });

  it("rejects requests without token", async () => {
    const r = await handleIpcRequest({
      method: "GET",
      pathname: IPC_ROUTES.health,
      headers: {},
      ctx,
    });
    expect(r.status).toBe(401);
  });

  it("returns health with extension and cursor version", async () => {
    const r = await handleIpcRequest({
      method: "GET",
      pathname: IPC_ROUTES.health,
      headers: { "x-bridge-ipc-token": "test-token" },
      ctx,
    });
    expect(r.status).toBe(200);
    expect(buildHealthResponse(ctx)).toMatchObject({
      ok: true,
      extensionVersion: "2.2.0",
      cursorVersion: "2.3.0",
      port: 3848,
    });
  });

  it("returns capabilities", async () => {
    const r = await handleIpcRequest({
      method: "GET",
      pathname: IPC_ROUTES.capabilities,
      headers: { "x-bridge-ipc-token": "test-token" },
      ctx,
    });
    expect(r.status).toBe(200);
    expect(buildCapabilitiesResponse().methods).toContain("extension-api");
  });

  it("validateExecuteBody requires requestId", () => {
    expect(validateExecuteBody({ actionId: "cursor.ide.status.get" }).ok).toBe(false);
  });
});

describe("Step 4 — token + handshake", () => {
  it("token paths outside project", () => {
    const projectRoot = path.join(__dirname, "..");
    const checks = assertTokenStorageOutsideProject(projectRoot);
    expect(checks.tokenNotInCursorDir).toBe(true);
    expect(checks.tokenOutsideProject).toBe(true);
  });

  it("handshake rejects token fields", () => {
    expect(handshakeContainsForbiddenFields({ token: "x", tokenRef: "user-config" })).toMatch(
      /Forbidden/
    );
    expect(
      handshakeContainsForbiddenFields({
        port: 3848,
        pid: 1,
        tokenRef: "user-config",
        extensionVersion: "1",
        startedAt: new Date().toISOString(),
      })
    ).toBeUndefined();
  });

  it("writes handshake without token to user config", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-ext-ipc-"));
    process.env.BRIDGE_USER_CONFIG_DIR = tmpDir;

    const hs = writeIdeControlHandshake({
      port: 3848,
      pid: process.pid,
      extensionVersion: "2.2.0",
    });
    expect(hs.tokenRef).toBe("user-config");
    expect(hs).not.toHaveProperty("token");

    const raw = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "bridge-ide-control-handshake.json"), "utf8")
    );
    expect(handshakeContainsForbiddenFields(raw)).toBeUndefined();
    expect(readIdeControlHandshake()?.port).toBe(3848);

    const token = ensureIpcToken();
    expect(tokenMatches(token)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "ipc-token"))).toBe(true);

    delete process.env.BRIDGE_USER_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
