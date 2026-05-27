import * as vscode from "vscode";

export async function getIdeStatus(extensionVersion: string): Promise<Record<string, unknown>> {
  const folders = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? [];
  const active = vscode.window.activeTextEditor;
  const visibleEditors = vscode.window.visibleTextEditors;

  let errors = 0;
  let warnings = 0;
  const seenUris = new Set<string>();
  for (const doc of vscode.workspace.textDocuments) {
    const key = doc.uri.toString();
    if (seenUris.has(key)) continue;
    seenUris.add(key);
    for (const d of vscode.languages.getDiagnostics(doc.uri)) {
      if (d.severity === vscode.DiagnosticSeverity.Error) errors++;
      if (d.severity === vscode.DiagnosticSeverity.Warning) warnings++;
    }
  }

  const terminals = vscode.window.terminals;
  const extensions = vscode.extensions.all.filter((e) => !e.id.startsWith("vscode."));

  return {
    cursor: { running: true, version: vscode.version },
    extension: { version: extensionVersion, host: "bridge-ide-control" },
    workspace: { folders },
    editor: active
      ? {
          activeFile: vscode.workspace.asRelativePath(active.document.uri),
          line: active.selection.active.line + 1,
        }
      : null,
    visibleTextEditors: {
      count: visibleEditors.length,
      paths: visibleEditors.map((e) => vscode.workspace.asRelativePath(e.document.uri)),
    },
    problems: { errors, warnings },
    terminals: { count: terminals.length, names: terminals.map((t) => t.name) },
    extensions: { installed: extensions.length },
  };
}
