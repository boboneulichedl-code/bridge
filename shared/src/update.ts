import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  compareSemver,
  findBridgeRoot,
  isNewerVersion,
  loadVersionManifest,
  type VersionManifest,
} from "./version";

export interface UpdateCheckResult {
  current: VersionManifest;
  installed: VersionManifest | null;
  updateAvailable: boolean;
  message: string;
}

export function getVersionLockPath(cwd = process.cwd()): string {
  return path.join(cwd, ".cursor", "bridge-version.lock");
}

export function readInstalledVersion(cwd = process.cwd()): VersionManifest | null {
  const lock = getVersionLockPath(cwd);
  if (!fs.existsSync(lock)) return null;
  try {
    return JSON.parse(fs.readFileSync(lock, "utf8")) as VersionManifest;
  } catch {
    return null;
  }
}

export function writeVersionLock(manifest: VersionManifest, cwd = process.cwd()): void {
  const lock = getVersionLockPath(cwd);
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  fs.writeFileSync(lock, JSON.stringify(manifest, null, 2));
}

export function checkForUpdate(cwd = process.cwd()): UpdateCheckResult {
  const root = findBridgeRoot(cwd);
  const current = loadVersionManifest(root);
  const installed = readInstalledVersion(cwd);

  if (!installed) {
    return {
      current,
      installed: null,
      updateAvailable: true,
      message: `Bridge ${current.version} noch nicht registriert — Update empfohlen.`,
    };
  }

  const updateAvailable = isNewerVersion(installed.version, current.version);
  return {
    current,
    installed,
    updateAvailable,
    message: updateAvailable
      ? `Update verfügbar: ${installed.version} → ${current.version}`
      : `Bridge ${current.version} ist aktuell.`,
  };
}

function run(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    child.on("error", () => resolve(1));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

export async function applyUpdate(cwd = process.cwd()): Promise<{ ok: boolean; message: string }> {
  const root = findBridgeRoot(cwd);
  const before = loadVersionManifest(root);

  const buildCode = await run("npm", ["run", "build"], root);
  if (buildCode !== 0) {
    return { ok: false, message: "Build fehlgeschlagen." };
  }

  const after = loadVersionManifest(root);
  writeVersionLock(after, cwd);

  return {
    ok: true,
    message:
      compareSemver(before.version, after.version) !== 0
        ? `Update angewendet: ${before.version} → ${after.version}`
        : `Bridge ${after.version} neu gebaut und registriert.`,
  };
}
