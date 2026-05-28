# Bridge — Workflow Efficiency (Adapter Index)

**Status:** Active — enforcement stub; canonical rules live outside repo  
**Enforcement:** [rules/workflow-efficiency.mdc](../../../rules/workflow-efficiency.mdc) (`alwaysApply: true`)

---

## Canonical sources (outside Bridge repo)

| Layer | Path |
|-------|------|
| Global rules | `C:\CoreAI\communication\.rules\communication-global.rules.md` |
| Global docs | `C:\CoreAI\communication\.docs\communication-global.md` |
| Cursor rules | `C:\CoreAI\communication\cursor\.rules-cursor\cursor-export-law.rules.md` |
| Cursor docs | `C:\CoreAI\communication\cursor\.docs-cursor\cursor-export-law.md` |
| **Cursor output** | `C:\CoreAI\communication\cursor\output\` |

---

## Cursor Export Law (summary)

1. **Every response** → WORKFLOW + PLAN (control phase) in `cursor\output\`
2. **Schemas:** `YYYY-MM-DD_HHMMSS_BRIDGE_WORKFLOW_<ID>_*.md` / `..._BRIDGE_PLAN_...`
3. **PLAN file top:** PLAN EXPORT DECISION block
4. **Output Gate:** both files required; HANDOFF FILES block before NEXT ACTION
5. **Write failure:** `HANDOFF WRITE FAILED` only
6. **Server sync:** background watcher at `C:\CoreAI\communication\cursor\.sync\` — Cursor writes locally; `Sync status: handled by watcher`

Full spec: `cursor-export-law.md` (path above).

---

## Bridge-specific templates

### EXECUTION_DONE fields

changed files, created files, tests run, `git status --short`, forbidden paths touched, REVIEW_READY pointer, next step.

### REVIEW_READY

Upload list, `bridge-{phase}-{YYYYMMDD}-review.zip`, exclude: `node_modules/`, `dist/`, `.git/`, etc.

### Git checkpoint

Explicit `git add` only; pre/post commit checks; `push: no (separate plan)`. PowerShell: `git commit -m "message"` only — no HEREDOC, no `--trailer`, no Co-authored-by requirement.

### Push plan

Commits ahead, fast-forward, [P2 Foundation](../../../.github/workflows/p2-foundation.yml) CI, `git push origin main`.

---

## Legacy (read-only)

- `chatgpt_files/cursor_responses/`
- `C:\CoreAI\communication\cursor\` (files not in `output\`)
- `C:\CoreAI\c-coreai-communication-cursor\`

---

## Maintenance

Edit canonical files under `C:\CoreAI\communication\` first. Keep this adapter index aligned. Do not commit handoff files from `cursor\output\`.
