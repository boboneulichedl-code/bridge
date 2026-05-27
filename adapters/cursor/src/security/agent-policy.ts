/** Agent subsystem policy for action 10 — default deny file changes via CLI --force */

export function normalizeAgentParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...params };
  if (out.allowFileChanges !== true) {
    out.allowFileChanges = false;
  }
  return out;
}

export function agentAllowsFileChanges(params: Record<string, unknown>): boolean {
  return params.allowFileChanges === true;
}
