import * as path from "node:path";
import * as vscode from "vscode";

/** Extension-side guard: fs paths should stay within an open workspace folder */
export function assertPathWithinWorkspace(fsPath: string): void {
  const folders = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? [];
  if (folders.length === 0) {
    throw new Error("No workspace folder open — cannot validate path");
  }
  const target = path.resolve(fsPath);
  const allowed = folders.some((root) => {
    const rel = path.relative(root, target);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  });
  if (!allowed) {
    throw new Error("Path is outside open workspace folders");
  }
}

export function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}
