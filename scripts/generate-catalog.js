#!/usr/bin/env node
/** Generates integrations/catalog.json from shared module for VSIX bundling. */
const { writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const { INTEGRATIONS, listIntegrationStatus } = require("../shared/dist/index.js");

const outDir = join(__dirname, "..", "integrations");
mkdirSync(outDir, { recursive: true });

writeFileSync(
  join(outDir, "catalog.json"),
  JSON.stringify({ integrations: INTEGRATIONS, status: listIntegrationStatus() }, null, 2)
);
console.log("Generated integrations/catalog.json");
