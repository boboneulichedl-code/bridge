import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { GuiNode, GuiSnapshot } from "./types";

function hashNodes(nodes: GuiNode[]): string {
  const flat: string[] = [];
  const walk = (n: GuiNode) => {
    flat.push(
      `${n.automationId}|${n.controlType}|${n.name}|${n.bounds.x},${n.bounds.y},${n.bounds.width},${n.bounds.height}|${n.children.length}`
    );
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return crypto.createHash("sha256").update(flat.join("\n")).digest("hex").slice(0, 16);
}

export function snapshotKey(processName: string, className: string, title: string): string {
  const titleHash = crypto.createHash("md5").update(title).digest("hex").slice(0, 8);
  return `${processName}::${className}::${titleHash}`.replace(/[<>:"/\\|?*]/g, "_");
}

export class GuiCacheStore {
  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private filePath(key: string): string {
    return path.join(this.dir, `${key}.json`);
  }

  load(key: string): GuiSnapshot | null {
    const fp = this.filePath(key);
    if (!fs.existsSync(fp)) return null;
    try {
      return JSON.parse(fs.readFileSync(fp, "utf8")) as GuiSnapshot;
    } catch {
      return null;
    }
  }

  save(snapshot: GuiSnapshot): void {
    fs.writeFileSync(this.filePath(snapshot.key), JSON.stringify(snapshot, null, 2));
  }

  bumpOrCreate(
    key: string,
    meta: Omit<GuiSnapshot, "key" | "version" | "fingerprint" | "capturedAt" | "nodes">,
    nodes: GuiNode[]
  ): GuiSnapshot {
    const fingerprint = hashNodes(nodes);
    const existing = this.load(key);
    const version =
      existing && existing.fingerprint === fingerprint ? existing.version : (existing?.version ?? 0) + 1;

    const snapshot: GuiSnapshot = {
      key,
      version,
      fingerprint,
      ...meta,
      nodes,
      capturedAt: new Date().toISOString(),
    };
    this.save(snapshot);
    return snapshot;
  }

  isFresh(key: string, fingerprint: string): boolean {
    const existing = this.load(key);
    return !!existing && existing.fingerprint === fingerprint;
  }
}
