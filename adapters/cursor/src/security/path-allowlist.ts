import * as path from "node:path";

export function getAllowedPathRoots(): string[] {
  const raw = process.env.BRIDGE_ALLOWED_PATHS || "";
  if (!raw.trim()) {
    return [process.cwd()];
  }
  return raw
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => path.resolve(p));
}

export function normalizePath(input: string): string {
  return path.resolve(input);
}

export function isPathAllowed(input: string): boolean {
  const target = normalizePath(input);
  const roots = getAllowedPathRoots();
  return roots.some((root) => {
    const rel = path.relative(root, target);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  });
}
