# Bridge — Workflow Efficiency Rules

**Status:** Active  
**Purpose:** Make the Cursor → User → ChatGPT loop faster with less copy/paste and less uncertainty.  
**Enforcement rule:** [rules/workflow-efficiency.mdc](../../../rules/workflow-efficiency.mdc) (`alwaysApply: true`)

This document is the **canonical human-readable spec**. The Cursor rule is the **enforcement summary**. Both must stay aligned.

This spec **extends** global RF/WF user rules. It does not replace RF headers or end lines.

---

## Loop overview

```mermaid
flowchart LR
  Cursor["Cursor Agent"]
  User["User"]
  ChatGPT["ChatGPT Review"]
  Rule["rules/workflow-efficiency.mdc"]
  Docs["docs/adapters/cursor/workflow-efficiency.md"]
  Cursor --> Rule
  Cursor --> User
  Cursor --> ResponseFile["cursor_responses BRIDGE_WORKFLOW"]
  User -->|"ZIP + file list"| ChatGPT
  User --> ResponseFile
  Docs --> User
  Rule --> Docs
  ResponseFile --> ChatGPT
```

---

## 0. Cursor response file — BRIDGE filename law (every response, permanent unique)

After **every** Cursor response, save a **new** Markdown file permanently under:

```
chatgpt_files/cursor_responses/
```

Response files are a **chronological audit/handoff protocol** for User and ChatGPT.

### Filename pattern (exact schema)

```
YYYY-MM-DD_HHMMSS_BRIDGE_WORKFLOW_<ID>_<cursor-topic>.md
```

**Never use 4-digit HHMM.** Time segment is always **HHMMSS** (exactly 6 digits, local time).

### Segment reference

| Segment | Rule | Example |
|---------|------|---------|
| Date | `YYYY-MM-DD` | `2026-05-28` |
| Time | `HHMMSS` (6 digits) | `065234` |
| Fixed | always `BRIDGE` | `BRIDGE` |
| Fixed | always `WORKFLOW` | `WORKFLOW` |
| `<ID>` | Current work ID | `P2-1-pre-1`, `P2-1-pre-report`, `P2-1a`, `Git-Checkpoint`, `CI-Fix`, `GENERAL` |
| `<cursor-topic>` | Short, Cursor-defined | `execution-done_visual-foundation` |
| Collision | append before `.md` | `_01`, `_02`, `_03` |

### Character rules

- Allowed: `A-Z`, `a-z`, `0-9`, hyphen (`-`), underscore (`_`)
- **No** spaces
- **No** colons
- **No** other special characters

### Uniqueness and retention (mandatory)

| Rule | Requirement |
|------|-------------|
| Overwrite | **Never** overwrite an existing response file |
| Collision | If filename exists, append `_01`, `_02`, `_03`, … until unique |
| Delete | **Never** delete old response files |
| Move | **Never** move response files to `chatgpt_files/analysed/` |
| Purpose | Permanent chronological audit/handoff log |

### Examples

- `2026-05-28_065234_BRIDGE_WORKFLOW_P2-1-pre-1_execution-done_visual-foundation.md`
- `2026-05-28_070012_BRIDGE_WORKFLOW_P2-1-pre-report_plan-created_git-checkpoint.md`
- `2026-05-28_070045_BRIDGE_WORKFLOW_GENERAL_test_response-file-handoff.md`
- `2026-05-28_070045_BRIDGE_WORKFLOW_GENERAL_test_response-file-handoff_01.md`

### Legacy files

Files already saved under older naming patterns (without `BRIDGE_WORKFLOW`) **remain unchanged**. Do not rename, delete, or move them. The BRIDGE filename law applies to **new** response files only.

### File must always contain

| Field | Required |
|-------|----------|
| Task | yes |
| Phase | yes |
| Workflow | yes |
| Mode | yes |
| Full Cursor response | yes — complete body, not a summary |
| NEXT ACTION block | yes |

### Include when applicable

- Current git stand (HEAD, branch, ahead/behind)
- changed files / created files
- tests run (command + result)
- `git status --short`
- forbidden paths touched yes/no
- review bundle recommendation
- CI status / failed step logs
- exact staging list / push plan

### Chat rules

- The chat message **may be short** — the file holds the full answer
- **Always** state the exact path of the **newly saved** response file in chat
- Write a **new** file even for trivial one-word answers
- **No exceptions** except a technical write failure — then report the error in chat

### Response file template

```markdown
# Cursor Response

- **Task:** ...
- **Phase:** ...
- **Workflow:** ...
- **Mode:** ...
- **Filename:** YYYY-MM-DD_HHMMSS_BRIDGE_WORKFLOW_<ID>_<cursor-topic>.md
- **Saved at:** YYYY-MM-DD HH:MM:SS (local)

---

<full Cursor response body>

---

## Optional appendix
...
```

### Exclude from review ZIPs (response files)

Response files under `chatgpt_files/cursor_responses/` are for User → ChatGPT handoff. Include in ZIP only when explicitly requested for audit. Do not prune or archive as part of normal workflow.

---

## 1. NEXT ACTION (every Cursor response)

Every Cursor response ends with this block (after main content, before RF end line):

```markdown
NEXT ACTION:
- Mode: Plan | Agent | Ask
- User action: <one clear action>
- Blocked by: <what is missing, or "none">
- Suggested prompt/action: <copy-paste-ready prompt or command>
```

### Mode mapping

| Workflow state | Mode | Typical user action |
|----------------|------|---------------------|
| PLAN_CREATED | Plan | Reply `PLAN_REVIEWED` or request corrections |
| PLAN_REVIEWED | Plan | Confirm `FINAL_PLAN_CONFIRMED` or refine scope |
| FINAL_PLAN_CONFIRMED | Agent | Start execution (Agent button) |
| EXECUTION_DONE | Plan / Agent | Review output; request fixes or approve |
| REVIEW_DONE | Plan | Request next phase `PLAN_CREATED` |

### Example (after a plan)

```markdown
NEXT ACTION:
- Mode: Plan
- User action: Review plan and reply PLAN_REVIEWED or request corrections
- Blocked by: none
- Suggested prompt/action: PLAN_REVIEWED — Workflow Efficiency Rules. Bitte FINAL_PLAN_CANDIDATE erstellen.
```

---

## 2. EXECUTION_DONE report (standard fields)

Every execution completion must include:

| Field | Description |
|-------|-------------|
| changed files | Explicit list, or `none` |
| created files | Explicit list, or `none` |
| tests run | Command + pass/fail count, or `none` |
| git status --short | Verbatim output, or `clean` |
| forbidden paths touched | `yes/no` — if yes, list paths |
| review bundle recommendation | Short pointer to REVIEW_READY section |
| next safe step | One sentence |

### Example

```markdown
## Execution report

- **changed files:** none
- **created files:** rules/workflow-efficiency.mdc, docs/adapters/cursor/workflow-efficiency.md
- **tests run:** none (docs-only)
- **git status --short:** ?? rules/workflow-efficiency.mdc, ?? docs/adapters/cursor/workflow-efficiency.md
- **forbidden paths touched:** no
- **review bundle recommendation:** see REVIEW_READY below
- **next safe step:** Review both files; then plan Git checkpoint if approved
```

### Standard forbidden paths (when out of scope)

| Path | Reason |
|------|--------|
| `web/` | Product shell — separate phase |
| `api/src/` (runtime) | P0 pipeline frozen unless scoped |
| `adapters/cursor/src/` | Adapter runtime — separate phase |
| `shared/` | Shared contract — separate phase |
| `packages/ui-cursor/` | Renderer scaffold — P2.1b+ |
| `package.json`, `package-lock.json` | Only when explicitly scoped |
| `.github/workflows/` | CI changes need explicit approval |
| `packages/ui/preview/dist/` | Build artifact |
| `packages/ui/preview/review-artifacts/` | Local review screenshots |
| `bridge.version.json`, `integrations/catalog.json` | Build side effects — revert after `npm run build` |

---

## 3. REVIEW_READY (upload / ZIP guidance)

When marking REVIEW_READY, always include:

### exact files to upload

List every file ChatGPT should review — explicit paths, no vague globs.

### suggested ZIP name

```
bridge-{phase}-{YYYYMMDD}-review.zip
```

Examples:

- `bridge-p2.1-pre-20260528-review.zip`
- `bridge-workflow-efficiency-20260528-review.zip`

### files/folders to exclude

```
node_modules/
dist/
packages/ui/preview/dist/
packages/ui/preview/review-artifacts/
.env
bridge.version.json
integrations/catalog.json
.git/
```

**Include guidance:**

- Scope files only + relevant docs/tests
- Docs-only phase: report file (+ plan export if used)
- Do not include `package-lock.json` unless lockfile change was in scope

### Example (docs-only workflow rules)

```markdown
REVIEW_READY: yes

**Upload for ChatGPT:**
- rules/workflow-efficiency.mdc
- docs/adapters/cursor/workflow-efficiency.md

**Suggested ZIP:** bridge-workflow-efficiency-20260528-review.zip

**Exclude:** node_modules/, dist/, .git/, bridge.version.json, integrations/catalog.json
```

---

## 4. Git checkpoint plan (template)

Every Git checkpoint plan must contain:

### exact staging list

```text
git add rules/workflow-efficiency.mdc
git add docs/adapters/cursor/workflow-efficiency.md
```

Never `git add -A`, `git add .`, or `git add docs/` unless explicitly approved.

### forbidden files

List what must **not** appear in the commit (see forbidden paths table above).

### pre-commit checks

```powershell
git status --short
git diff --stat
git diff --cached --stat
git branch --show-current
```

Abort if anything outside the staging list is modified or untracked (except explicitly allowed artifacts).

### post-commit checks

```powershell
git show --stat HEAD
git status --short
git rev-list --count origin/main..HEAD
git log -1 --oneline
```

Expect: only staged files in commit; working tree clean; ahead count matches plan.

### push yes/no

Always explicit:

- `push: no (separate push plan required)`, or
- link to a dedicated push plan

### PowerShell commit

Use simple `-m` only — **no HEREDOC**:

```powershell
git commit -m "docs(cursor): add workflow efficiency rules"
```

---

## 5. Push plan (template)

Every push plan must contain:

### exact commits ahead

| SHA | Message |
|-----|---------|
| `<sha>` | `<message>` |

Verify with:

```powershell
git fetch origin
git log --oneline origin/main..HEAD
git rev-list --count origin/main..HEAD
```

### fast-forward check

- Branch must be `main`
- Working tree clean
- `origin/main..HEAD` contains exactly the planned commit(s)
- Remote not ahead of local
- Abort if push would not be fast-forward

### CI expected run

Push to `main` triggers [P2 Foundation](../../../.github/workflows/p2-foundation.yml):

1. `npm ci`
2. `npm run validate:ui-modules`
3. `npm run generate:control-tokens`
4. `git diff --exit-code packages/ui/src/generated/`
5. `npm run test:p2-ui`
6. `npm run test:p0`
7. `npm run build`

Docs-only commits still trigger the full workflow.

### how to report CI result

After push, report:

| Field | Source |
|-------|--------|
| Push exit status | `git push origin main` |
| CI started | yes/no |
| Run number | e.g. Run #6 |
| Head SHA | commit pushed |
| Status | `in_progress` / `success` / `failure` |
| URL | `https://github.com/boboneulichedl-code/bridge/actions/runs/<id>` |

If `gh` is unavailable, use GitHub Actions UI or API:

```
GET /repos/boboneulichedl-code/bridge/actions/runs?branch=main&per_page=1
```

### push command

```powershell
git push origin main
```

No `--force` unless explicitly approved.

---

## 6. Reference example (P2.1-pre)

| Step | Detail |
|------|--------|
| Feature commits | `b330fe8` (pre-0), `f7e1d7a` (pre-1) |
| Report commit | `5ccec91` — `docs(ui): add P2.1-pre completion report` |
| Push | `f7e1d7a..5ccec91` fast-forward |
| CI | P2 Foundation Run #6 — triggered on docs push |

See [p2.1-pre-completion-report.md](p2.1-pre-completion-report.md) for phase deliverables.

---

## 7. Maintenance

When updating workflow rules:

1. Edit this doc first (canonical spec)
2. Sync [rules/workflow-efficiency.mdc](../../../rules/workflow-efficiency.mdc) summary
3. Keep examples current with real phase names and BRIDGE_WORKFLOW filename schema
4. Commit workflow rule files together in a docs-only checkpoint
5. `chatgpt_files/cursor_responses/` — response logs; commit only when explicitly scoped
