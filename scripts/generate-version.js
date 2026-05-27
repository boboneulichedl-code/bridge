#!/usr/bin/env node
const { execSync } = require("node:child_process");
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = rootPkg.version;

function readPkg(name) {
  try {
    return JSON.parse(readFileSync(join(root, name, "package.json"), "utf8")).version;
  } catch {
    return version;
  }
}

let git = {};
try {
  git = {
    commit: execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
    branch: execSync("git rev-parse --abbrev-ref HEAD", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
  };
} catch {
  /* not a git repo */
}

const manifest = {
  version,
  build: new Date().toISOString(),
  git,
  components: {
    root: version,
    shared: readPkg("shared"),
    cli: readPkg("cli"),
    api: readPkg("api"),
    web: readPkg("web"),
    extension: readPkg("extension"),
    mcpServer: readPkg("mcp-server"),
  },
  api: {
    minClientVersion: "1.0.0",
    spec: "/api/v1",
    studioSpec: "/api/v1/studio",
  },
};

writeFileSync(join(root, "bridge.version.json"), JSON.stringify(manifest, null, 2));
console.log(`Generated bridge.version.json v${version}`);
