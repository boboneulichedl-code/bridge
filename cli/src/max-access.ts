import * as fs from "node:fs";
import * as path from "node:path";
import {
  disableMaxAccess,
  enableMaxAccess,
  getMaxAccessMarkerPath,
  HOOKS_JSON,
  isMaxAccessEnabled,
  patchMcpConfigForMaxAccess,
} from "@bridge/shared";

function copyHooksToProject(cwd: string, bridgeRoot: string): void {
  const srcHooks = path.join(bridgeRoot, ".cursor", "hooks");
  const dstHooks = path.join(cwd, ".cursor", "hooks");
  fs.mkdirSync(dstHooks, { recursive: true });

  for (const file of ["max-access-shell.js", "max-access-mcp.js", "max-access-tool.js"]) {
    fs.copyFileSync(path.join(srcHooks, file), path.join(dstHooks, file));
  }

  const hooksJsonPath = path.join(cwd, ".cursor", "hooks.json");
  fs.mkdirSync(path.dirname(hooksJsonPath), { recursive: true });
  fs.writeFileSync(hooksJsonPath, JSON.stringify(HOOKS_JSON, null, 2));
}

export function cmdMaxAccess(action: string, bridgeRoot: string): number {
  const cwd = process.cwd();

  switch (action) {
    case "on":
    case "enable": {
      enableMaxAccess(cwd);
      copyHooksToProject(cwd, bridgeRoot);
      patchMcpConfigForMaxAccess(bridgeRoot, true);
      console.log("Bridge Max Access: AN");
      console.log(`  Marker: ${getMaxAccessMarkerPath(cwd)}`);
      console.log("  Hooks: .cursor/hooks.json installiert");
      console.log("  MCP: BRIDGE_MAX_ACCESS=1 in ~/.cursor/mcp.json");
      console.log("");
      console.log("Cursor neu laden (Reload Window) empfohlen.");
      return 0;
    }
    case "off":
    case "disable": {
      disableMaxAccess(cwd);
      patchMcpConfigForMaxAccess(bridgeRoot, false);
      console.log("Bridge Max Access: AUS");
      return 0;
    }
    case "status": {
      const on = isMaxAccessEnabled(cwd);
      console.log(`Bridge Max Access: ${on ? "AN" : "AUS"}`);
      console.log(`  Marker: ${fs.existsSync(getMaxAccessMarkerPath(cwd)) ? "ja" : "nein"}`);
      console.log(`  Env BRIDGE_MAX_ACCESS: ${process.env.BRIDGE_MAX_ACCESS ?? "(unset)"}`);
      return 0;
    }
    default:
      console.error("Verwendung: bridge max-access on|off|status");
      return 1;
  }
}
