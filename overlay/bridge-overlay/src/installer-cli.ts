import { ensureDirs, loadConfig, INSTALL_DIR, DATA_DIR, CACHE_DIR } from "./installer";

ensureDirs();
console.log("Bridge Overlay Pfade:");
console.log("  Install:", INSTALL_DIR);
console.log("  Data:   ", DATA_DIR);
console.log("  Cache:  ", CACHE_DIR);
console.log("  Config: ", loadConfig());
