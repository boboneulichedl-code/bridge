import * as fs from "node:fs";
import * as path from "node:path";

export interface VersionManifest {
  version: string;
  build: string;
  git?: { commit?: string; branch?: string };
  components: Record<string, string>;
  api: { minClientVersion: string; spec: string };
}

const ROOT_MARKER = "bridge.version.json";

export function findBridgeRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, ROOT_MARKER))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

export function loadVersionManifest(root?: string): VersionManifest {
  const bridgeRoot = root ?? findBridgeRoot();
  const file = path.join(bridgeRoot, ROOT_MARKER);
  if (!fs.existsSync(file)) {
    return {
      version: "0.0.0",
      build: "",
      components: {},
      api: { minClientVersion: "1.0.0", spec: "/api/v1" },
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as VersionManifest;
}

export function parseSemver(v: string): [number, number, number] {
  const m = v.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

export function isNewerVersion(current: string, latest: string): boolean {
  return compareSemver(current, latest) < 0;
}
