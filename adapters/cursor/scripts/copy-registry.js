#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const src = path.join(__dirname, "..", "registry");
const dest = path.join(__dirname, "..", "dist", "registry");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(src, dest);
console.log("Copied registry JSON to dist/registry");
