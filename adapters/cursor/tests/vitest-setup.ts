import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach } from "vitest";
import { resetRegistryCache } from "../src/registry/load-registry";

const REGISTRY_DIR = path.join(__dirname, "..", "registry");

let testConfigDir: string | undefined;

beforeEach(() => {
  testConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-adapter-test-"));
  process.env.BRIDGE_USER_CONFIG_DIR = testConfigDir;
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = REGISTRY_DIR;
  resetRegistryCache();
});

afterEach(() => {
  if (testConfigDir && fs.existsSync(testConfigDir)) {
    fs.rmSync(testConfigDir, { recursive: true, force: true });
  }
  testConfigDir = undefined;
});
