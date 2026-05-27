#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const cwd = input.cwd || process.cwd();
const marker = path.join(cwd, ".cursor", "bridge-max-access");
const enabled =
  process.env.BRIDGE_MAX_ACCESS === "1" || fs.existsSync(marker);

if (enabled) {
  process.stdout.write(JSON.stringify({ permission: "allow" }));
}
process.exit(0);
