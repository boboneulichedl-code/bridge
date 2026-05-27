import * as fs from "node:fs";
import * as path from "node:path";
import type { ActionExecutor, ActionResult, ExecutionContext } from "../../types/action";
import { isPathAllowed } from "../../security/path-allowlist";

function readWorkspaceSettings(cwd: string): Record<string, unknown> {
  const file = path.join(cwd, ".vscode", "settings.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeWorkspaceSettings(cwd: string, settings: Record<string, unknown>): void {
  const dir = path.join(cwd, ".vscode");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify(settings, null, 2));
}

const FS_ACTIONS = new Set([
  "cursor.ide.fs.mkdir",
  "cursor.ide.fs.write",
  "cursor.ide.settings.get",
  "cursor.ide.settings.set",
]);

export function createFilesystemExecutor(): ActionExecutor {
  return {
    method: "filesystem",
    async canExecute(ctx) {
      return (
        !ctx.extensionReachable &&
        ctx.action.fallbackMethods.some((f) => f.method === "filesystem") &&
        FS_ACTIONS.has(ctx.actionId)
      );
    },
    async execute(ctx): Promise<ActionResult> {
      const actionId = ctx.actionId;

      if (actionId === "cursor.ide.fs.mkdir") {
        const p = String(ctx.params.path ?? "");
        if (!isPathAllowed(p)) {
          return { ok: false, error: "Path not allowed", methodUsed: "filesystem" };
        }
        fs.mkdirSync(p, { recursive: true });
        return { ok: true, data: { path: p }, methodUsed: "filesystem" };
      }

      if (actionId === "cursor.ide.fs.write") {
        const p = String(ctx.params.path ?? "");
        const content = String(ctx.params.content ?? "");
        if (!isPathAllowed(p)) {
          return { ok: false, error: "Path not allowed", methodUsed: "filesystem" };
        }
        let previous: string | null = null;
        if (fs.existsSync(p)) {
          if (ctx.params.overwriteExisting !== true) {
            return {
              ok: false,
              error: "File exists; set overwriteExisting: true",
              methodUsed: "filesystem",
            };
          }
          previous = fs.readFileSync(p, "utf8");
        }
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, content, "utf8");
        return {
          ok: true,
          data: { path: p },
          methodUsed: "filesystem",
          snapshotPayload:
            previous !== null ? { path: p, content: previous } : undefined,
        };
      }

      if (actionId === "cursor.ide.settings.get") {
        const settings = readWorkspaceSettings(ctx.cwd);
        const section = String(ctx.params.section ?? "");
        const key = String(ctx.params.key ?? "");
        const sectionObj = (settings[section] as Record<string, unknown>) ?? settings;
        const value =
          section && settings[section]
            ? (settings[section] as Record<string, unknown>)[key]
            : (sectionObj as Record<string, unknown>)[key];
        return {
          ok: true,
          data: { section, key, value },
          methodUsed: "filesystem",
        };
      }

      if (actionId === "cursor.ide.settings.set") {
        const section = String(ctx.params.section ?? "");
        const key = String(ctx.params.key ?? "");
        const value = ctx.params.value;
        const settings = readWorkspaceSettings(ctx.cwd);
        const previous = { ...settings };
        if (!settings[section]) settings[section] = {};
        (settings[section] as Record<string, unknown>)[key] = value;
        writeWorkspaceSettings(ctx.cwd, settings);
        return {
          ok: true,
          data: { section, key, value },
          methodUsed: "filesystem",
          snapshotPayload: { previous, section, key },
        };
      }

      return {
        ok: false,
        error: "Filesystem executor does not support this action",
        methodUsed: "filesystem",
      };
    },
  };
}
