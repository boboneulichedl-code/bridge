#!/usr/bin/env node
const {
  validateUiModulesRegistryFiles,
  formatValidationResult,
  repoRootFrom,
} = require("../adapters/cursor/dist/validation/ui-modules-registry-validator.js");

const repoRoot = repoRootFrom(__dirname);
const result = validateUiModulesRegistryFiles(repoRoot);
console.log(formatValidationResult(result));
process.exit(result.ok ? 0 : 1);
