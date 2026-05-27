import * as crypto from "node:crypto";

const SENSITIVE_KEYS = new Set([
  "content",
  "prompt",
  "value",
  "command",
  "path",
  "cwd",
]);

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function redactParamsForAudit(
  actionId: string,
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { actionId };

  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;

    if (key === "content" && typeof raw === "string") {
      out.contentHash = hashValue(raw);
      out.contentLength = raw.length;
      continue;
    }
    if (key === "prompt" && typeof raw === "string") {
      out.promptHash = hashValue(raw);
      out.promptLength = raw.length;
      continue;
    }
    if (key === "value") {
      out.valueHash = hashValue(JSON.stringify(raw));
      out.settingsKey = params.key;
      continue;
    }
    if (key === "command" && typeof raw === "string") {
      out.commandHash = hashValue(normalizeWhitespace(raw));
      out.commandLength = raw.length;
      continue;
    }
    if ((key === "path" || key === "cwd") && typeof raw === "string") {
      out[`${key}Hash`] = hashValue(raw.replace(/\\/g, "/").toLowerCase());
      continue;
    }
    if (!SENSITIVE_KEYS.has(key)) {
      out[key] = raw;
    }
  }

  return out;
}

export function hashRedactedParams(
  actionId: string,
  params: Record<string, unknown>
): string {
  const redacted = redactParamsForAudit(actionId, params);
  return hashValue(JSON.stringify(redacted));
}

export function debugPreview(
  params: Record<string, unknown>,
  maxLen = 200
): string | undefined {
  if (process.env.BRIDGE_AUDIT_DEBUG !== "1") return undefined;
  const parts: string[] = [];
  for (const key of ["prompt", "content", "command"]) {
    const v = params[key];
    if (typeof v === "string" && v) {
      parts.push(`${key}:${v.slice(0, maxLen)}`);
    }
  }
  return parts.length ? parts.join("|") : undefined;
}
