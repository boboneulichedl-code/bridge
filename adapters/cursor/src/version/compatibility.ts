/** Minimal semver range check for Cursor compatibility (>=x.y.z, <x.y.z). */

function parseVersion(v: string): [number, number, number] | null {
  const m = v.trim().replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compare(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function satisfiesRange(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  if (!parsed) return false;

  const trimmed = range.trim();
  if (trimmed.startsWith(">=")) {
    const rest = trimmed.slice(2).trim();
    const upper = rest.includes("<") ? rest.split("<")[1]?.trim() : undefined;
    const min = parseVersion(rest.split("<")[0]?.trim() ?? rest);
    if (!min || compare(parsed, min) < 0) return false;
    if (upper) {
      const max = parseVersion(upper);
      if (max && compare(parsed, max) >= 0) return false;
    }
    return true;
  }
  return parseVersion(trimmed) !== null && compare(parsed, parseVersion(trimmed)!) === 0;
}

export function isCursorVersionCompatible(
  cursorVersion: string,
  ranges: string[]
): boolean {
  if (!ranges.length) return true;
  return ranges.some((r) => satisfiesRange(cursorVersion, r));
}
