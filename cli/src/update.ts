import {
  applyUpdate,
  checkForUpdate,
  writeVersionLock,
  loadVersionManifest,
  findBridgeRoot,
} from "@bridge/shared";

export function cmdUpdate(action: string, bridgeRoot: string): Promise<number> {
  const cwd = process.cwd();

  switch (action) {
    case "check":
    case "status": {
      const result = checkForUpdate(cwd);
      console.log(JSON.stringify(result, null, 2));
      return Promise.resolve(0);
    }
    case "apply":
    case "install": {
      return applyUpdate(cwd).then((r) => {
        console.log(r.message);
        return r.ok ? 0 : 1;
      });
    }
    case "sync": {
      const root = findBridgeRoot(cwd);
      const manifest = loadVersionManifest(root);
      writeVersionLock(manifest, cwd);
      console.log(`Version ${manifest.version} registriert.`);
      return Promise.resolve(0);
    }
    default:
      console.error("Verwendung: bridge update check|apply|sync");
      return Promise.resolve(1);
  }
}
