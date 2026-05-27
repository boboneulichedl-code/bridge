#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const cwd = process.cwd();
const bridgeRoot = (() => {
  let dir = cwd;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, "bridge.version.json"))) return dir;
    const p = path.dirname(dir);
    if (p === dir) break;
    dir = p;
  }
  return cwd;
})();

const versionFile = path.join(bridgeRoot, "bridge.version.json");
const lockFile = path.join(cwd, ".cursor", "bridge-version.lock");

let current = { version: "0.0.0" };
if (fs.existsSync(versionFile)) {
  current = JSON.parse(fs.readFileSync(versionFile, "utf8"));
}

let installed = null;
if (fs.existsSync(lockFile)) {
  try {
    installed = JSON.parse(fs.readFileSync(lockFile, "utf8"));
  } catch {
    /* ignore */
  }
}

const updateAvailable =
  !installed ||
  installed.version !== current.version;

const output = {
  updateAvailable,
  current: current.version,
  installed: installed?.version ?? null,
  message: updateAvailable
    ? `Bridge Update: ${installed?.version ?? "neu"} → ${current.version}`
    : `Bridge ${current.version} aktuell`,
};

if (updateAvailable && process.env.BRIDGE_AUTO_UPDATE === "1") {
  spawnSync("npm", ["run", "build"], { cwd: bridgeRoot, shell: true, stdio: "inherit" });
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  fs.writeFileSync(lockFile, JSON.stringify(current, null, 2));
  output.autoUpdated = true;
}

console.log(JSON.stringify(output));
