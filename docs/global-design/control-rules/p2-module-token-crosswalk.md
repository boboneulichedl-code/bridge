# P2 Module Token Crosswalk

> **Status:** P2.0-pre deliverable (NOT runtime)  
> **Schema:** crosswalk-v1  
> **Phase:** P2.0-pre  
> **Source proposal:** [adapters/cursor/registry/p1-ui-modules.proposal.json](../../../adapters/cursor/registry/p1-ui-modules.proposal.json)  
> **Component catalog:** [tokens/control.components.json](tokens/control.components.json)  
> **Token source:** [tokens/control.tokens.json](tokens/control.tokens.json)

---

## Global decisions (P2.0-pre)

| ID | Decision | Resolution |
|----|----------|------------|
| **MO-003** | Spinner vs. Skeleton for loading | **Skeleton** for module card bodies (`control.pattern.loading.skeleton`, `control.component.skeleton.block`); **inline spinner** only on action submit buttons (`control.pattern.loading.spinnerInline`) |
| **VQ-003** | Icon set | **Text/badge-first** in P2 v1; no icon library dependency; state copy + semantic color only |

---

## blockerNotes (global)

| ID | Note | Phase |
|----|------|-------|
| BN-001 | `p1-ui-modules.proposal.json` still has `designrulesStatus: "missing-in-repo"` — update deferred to **P2.0** after runtime registry promotion | P2.0 |
| BN-002 | No `poc-v1-ui-modules.json` runtime file yet — promotion deferred to **P2.0** | P2.0 |
| BN-003 | CI validation script for empty `requiredDesignTokens`/`requiredComponents` deferred to **P2.0** (D3) | P2.0 |
| BN-004 | Light theme v1 (MQ-004) deferred post-P2 | Later |
| BN-005 | Optional D0c token contrast correction pass not executed in P2.0-pre | P2.0-opt |
| BN-006 | Icon illustrations optional; VQ-003 resolved as text/badge-first only | P2 v1 |
| BN-007 | Rollback/Restore UI wiring deferred to **P2.2**; P0.1 Restore API exists, UI must respect `rollbackAvailable` | P2.2 |
| BN-008 | WS `cursor.ide.status.changed` deferred to **P2.3** | P2.3 |

---

## Modules

### bridge.ui.permission.gate

| Field | Value |
|-------|-------|
| **moduleName** | Permission Gate |
| **runtimeStatus** | proposed |
| **riskLevel** | n/a |
| **sourceProposal** | p1-ui-modules.proposal.json — category: cross-cutting |

**requiredComponents:**
- `control.component.permissionGate.wrapper`
- `control.component.errorBlocked`

**requiredDesignTokens:**
- `control.color.surface`
- `control.color.textMuted`
- `control.color.danger`
- `control.color.border`
- `control.space.md`
- `control.touch.min`
- `control.opacity.disabled`

**requiredStates:** permission-denied, disabled, blocked

**linkedPreviewSections:** S09, S17

**permissionDependencies:** — (wraps children; reads per-module permissions)

**actionDependencies:** —

**blockingNotes:** —

**implementationNotesForLater:** P2.1 in `@bridge/ui`; complements API Security Gate; consumes `poc-v1-permissions.json`

---

### bridge.ui.cursor.status

| Field | Value |
|-------|-------|
| **moduleName** | Cursor Status |
| **runtimeStatus** | proposed |
| **riskLevel** | low |
| **sourceProposal** | p1-ui-modules.proposal.json — category: status |

**requiredComponents:**
- `control.component.card.status`
- `control.component.skeleton.block`
- `control.component.list.empty`
- `control.component.errorInline`
- `control.pattern.module.collapsed`
- `control.pattern.loading.skeleton`

**requiredDesignTokens:**
- `control.color.bg`
- `control.color.surface`
- `control.color.text`
- `control.color.textMuted`
- `control.color.accent`
- `control.color.ok`
- `control.color.warn`
- `control.color.danger`
- `control.space.md`
- `control.space.lg`
- `control.radius.lg`
- `control.type.title.size`
- `control.type.title.weight`
- `control.type.body.size`
- `control.type.body.weight`
- `control.type.caption.size`
- `control.type.caption.weight`

**requiredStates:** loading, empty, error, disabled, unreachable

**linkedPreviewSections:** S06, S11, S15

**permissionDependencies:** read

**actionDependencies:** cursor.ide.status.get

**blockingNotes:** —

**implementationNotesForLater:** Sticky top of stack; refresh via WS in P2.3

---

### bridge.ui.workspace

| Field | Value |
|-------|-------|
| **moduleName** | Workspace Open |
| **runtimeStatus** | proposed |
| **riskLevel** | medium |
| **sourceProposal** | p1-ui-modules.proposal.json — category: workspace |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.form.pathInput`
- `control.component.button.primary`
- `control.component.button.secondary`
- `control.component.dialog.confirm`
- `control.pattern.confirm.normal`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.accent`
- `control.color.surface`
- `control.color.border`
- `control.space.md`
- `control.touch.min`
- `control.radius.lg`
- `control.type.label.size`
- `control.type.label.weight`
- `control.type.body.size`
- `control.type.body.weight`

**requiredStates:** loading, confirmation-required, success, error, disabled

**linkedPreviewSections:** S05, S08, S11, S13

**permissionDependencies:** workspace

**actionDependencies:** cursor.ide.workspace.open; future: cursor.snapshots.restore

**blockingNotes:** Rollback CTA only when `rollbackAvailable: true` (BN-007)

**implementationNotesForLater:** bindModule bridge.ui.confirmation.dialog; snapshotId in response without false undo promise

---

### bridge.ui.editor

| Field | Value |
|-------|-------|
| **moduleName** | Editor Summary |
| **runtimeStatus** | proposed |
| **riskLevel** | low |
| **sourceProposal** | p1-ui-modules.proposal.json — category: editor |

**requiredComponents:**
- `control.component.card.surface`
- `control.component.badge.count`
- `control.pattern.module.collapsed`
- `control.component.list.empty`
- `control.component.errorInline`
- `control.pattern.loading.skeleton`

**requiredDesignTokens:**
- `control.color.surface`
- `control.color.text`
- `control.color.textMuted`
- `control.space.md`
- `control.radius.lg`
- `control.type.body.size`
- `control.type.body.weight`
- `control.type.mono.family`
- `control.type.mono.size`

**requiredStates:** loading, empty, error, disabled

**linkedPreviewSections:** S04, S06, S11

**permissionDependencies:** read

**actionDependencies:** — (read-only via status.get fields: editor.activeFile, editor.line, visibleTextEditors)

**blockingNotes:** —

**implementationNotesForLater:** Default collapsed per composition rules; dedicated editor actions later

---

### bridge.ui.file.create

| Field | Value |
|-------|-------|
| **moduleName** | File Create |
| **runtimeStatus** | proposed |
| **riskLevel** | medium-high |
| **sourceProposal** | p1-ui-modules.proposal.json — category: filesystem |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.form.pathInput`
- `control.component.form.textArea`
- `control.component.button.primary`
- `control.component.button.danger`
- `control.component.dialog.confirm`
- `control.pattern.confirm.normal`
- `control.component.riskBanner.destructive`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.danger`
- `control.color.warn`
- `control.color.surface`
- `control.space.md`
- `control.touch.min`
- `control.type.mono.family`
- `control.type.mono.size`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** loading, confirmation-required, success, error, disabled

**linkedPreviewSections:** S05, S08, S11, S13

**permissionDependencies:** fs-write

**actionDependencies:** cursor.ide.fs.mkdir, cursor.ide.fs.write

**blockingNotes:** overwriteRequiresConfirmation uses normal confirm + destructive banner (not separate pattern)

**implementationNotesForLater:** No rollback CTA until rollbackAvailable; audit shows hash only

---

### bridge.ui.settings

| Field | Value |
|-------|-------|
| **moduleName** | Settings |
| **runtimeStatus** | proposed |
| **riskLevel** | medium |
| **sourceProposal** | p1-ui-modules.proposal.json — category: settings |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.form.textInput`
- `control.component.form.selectAllowlist`
- `control.component.button.primary`
- `control.component.button.secondary`
- `control.component.dialog.confirm`
- `control.pattern.confirm.normal`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.accent`
- `control.color.surface`
- `control.space.md`
- `control.touch.min`
- `control.type.label.size`
- `control.type.label.weight`
- `control.type.body.size`
- `control.type.body.weight`

**requiredStates:** loading, confirmation-required, success, error, disabled

**linkedPreviewSections:** S05, S08, S13

**permissionDependencies:** read, settings

**actionDependencies:** cursor.ide.settings.get, cursor.ide.settings.set

**blockingNotes:** Write requires settings permission; values hashed in audit UI

**implementationNotesForLater:** confirmation required for settings.set only

---

### bridge.ui.extension.install

| Field | Value |
|-------|-------|
| **moduleName** | Extension Install |
| **runtimeStatus** | proposed |
| **riskLevel** | high / external-code |
| **sourceProposal** | p1-ui-modules.proposal.json — category: extensions |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.form.textInput`
- `control.component.button.danger`
- `control.component.riskBanner.externalCode`
- `control.component.dialog.confirm`
- `control.component.dialog.sheet`
- `control.pattern.confirm.externalCode`
- `control.component.badge.risk`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.warn`
- `control.color.danger`
- `control.color.surfaceElevated`
- `control.space.md`
- `control.touch.min`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** external-code-warning, confirmation-required, running, success, error, disabled

**linkedPreviewSections:** S07, S08, S13

**permissionDependencies:** extension-manage

**actionDependencies:** cursor.ide.extension.install

**blockingNotes:** —

**implementationNotesForLater:** S08 external-code banner mandatory; preRelease toggle optional in form

---

### bridge.ui.terminal.command

| Field | Value |
|-------|-------|
| **moduleName** | Terminal Command |
| **runtimeStatus** | proposed |
| **riskLevel** | destructive / high |
| **sourceProposal** | p1-ui-modules.proposal.json — category: terminal |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.form.selectAllowlist`
- `control.component.form.pathInput`
- `control.component.button.danger`
- `control.component.dialog.confirm`
- `control.pattern.confirm.destructive`
- `control.component.riskBanner.destructive`
- `control.component.badge.risk`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.danger`
- `control.color.text`
- `control.type.mono.family`
- `control.type.mono.size`
- `control.space.md`
- `control.touch.min`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** loading, confirmation-required, running, failed, disabled

**linkedPreviewSections:** S07, S08, S13

**permissionDependencies:** terminal

**actionDependencies:** cursor.ide.terminal.run

**blockingNotes:** MUST NOT free-text command; whitelist from poc-v1-terminal-whitelist.json only

**implementationNotesForLater:** Monospace command row in confirm dialog per S13

---

### bridge.ui.ide.command

| Field | Value |
|-------|-------|
| **moduleName** | IDE Command |
| **runtimeStatus** | proposed |
| **riskLevel** | high |
| **sourceProposal** | p1-ui-modules.proposal.json — category: commands |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.form.selectAllowlist`
- `control.component.button.danger`
- `control.component.dialog.confirm`
- `control.pattern.confirm.destructive`
- `control.component.badge.risk`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.danger`
- `control.color.accent`
- `control.space.md`
- `control.touch.min`
- `control.type.mono.family`
- `control.type.mono.size`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** loading, confirmation-required, running, success, error, disabled

**linkedPreviewSections:** S07, S08, S13

**permissionDependencies:** command-exec

**actionDependencies:** cursor.ide.command.execute

**blockingNotes:** Allowlist from poc-v1-commands.json only

**implementationNotesForLater:** —

---

### bridge.ui.panels

| Field | Value |
|-------|-------|
| **moduleName** | Panel Shortcuts |
| **runtimeStatus** | proposed |
| **riskLevel** | medium |
| **sourceProposal** | p1-ui-modules.proposal.json — category: panels |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.grid.shortcut`
- `control.component.button.secondary`
- `control.component.dialog.confirm`
- `control.pattern.confirm.normal`
- `control.pattern.module.collapsed`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.surface`
- `control.color.accent`
- `control.space.sm`
- `control.space.md`
- `control.touch.min`
- `control.radius.md`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** loading, confirmation-required, success, error, disabled

**linkedPreviewSections:** S05, S08, S11, S13

**permissionDependencies:** command-exec

**actionDependencies:** via cursor.ide.command.execute (panel shortcuts); future: cursor.ide.panel.focus

**blockingNotes:** perShortcut confirmation required

**implementationNotesForLater:** Default collapsed; shortcuts: explorer, scm, problems, terminal.new

---

### bridge.ui.git.status

| Field | Value |
|-------|-------|
| **moduleName** | Git Status |
| **runtimeStatus** | proposed |
| **riskLevel** | medium |
| **sourceProposal** | p1-ui-modules.proposal.json — category: git |

**requiredComponents:**
- `control.component.card.surface`
- `control.component.badge.count`
- `control.component.list.empty`
- `control.pattern.module.collapsed`
- `control.component.errorInline`
- `control.pattern.loading.skeleton`

**requiredDesignTokens:**
- `control.color.surface`
- `control.color.textMuted`
- `control.color.ok`
- `control.color.warn`
- `control.space.md`
- `control.type.body.size`
- `control.type.body.weight`
- `control.type.caption.size`
- `control.type.caption.weight`

**requiredStates:** loading, empty, error, disabled

**linkedPreviewSections:** S06, S11, S13

**permissionDependencies:** read, terminal

**actionDependencies:** — (read-only P2); optional terminal git whitelist: git status, git diff, git log

**blockingNotes:** No commit/push UI in P2 v1

**implementationNotesForLater:** partialP0 via status.get or terminal whitelist

---

### bridge.ui.problems

| Field | Value |
|-------|-------|
| **moduleName** | Problems |
| **runtimeStatus** | proposed |
| **riskLevel** | low |
| **sourceProposal** | p1-ui-modules.proposal.json — category: diagnostics |

**requiredComponents:**
- `control.component.card.surface`
- `control.component.badge.count`
- `control.component.button.secondary`
- `control.component.list.empty`
- `control.pattern.module.collapsed`
- `control.pattern.loading.skeleton`

**requiredDesignTokens:**
- `control.color.danger`
- `control.color.warn`
- `control.color.surface`
- `control.space.md`
- `control.type.label.size`
- `control.type.label.weight`
- `control.type.caption.size`
- `control.type.caption.weight`

**requiredStates:** loading, empty, error, disabled

**linkedPreviewSections:** S06, S11

**permissionDependencies:** read, command-exec

**actionDependencies:** focus via workbench.actions.view.problems; future: cursor.ide.diagnostics.list

**blockingNotes:** Counts only in P2 v1 (errors/warnings from status.get)

**implementationNotesForLater:** Default collapsed

---

### bridge.ui.agent.prompt

| Field | Value |
|-------|-------|
| **moduleName** | Agent Prompt (Subsystem) |
| **runtimeStatus** | proposed |
| **riskLevel** | high |
| **sourceProposal** | p1-ui-modules.proposal.json — category: agent-subsystem |

**requiredComponents:**
- `control.component.moduleSection`
- `control.component.moduleSection.header`
- `control.component.badge.subsystem`
- `control.component.form.textArea`
- `control.component.form.toggle`
- `control.component.button.danger`
- `control.component.dialog.confirm`
- `control.component.dialog.sheet`
- `control.pattern.confirm.destructive`
- `control.pattern.module.expanded`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.surfaceElevated`
- `control.color.warn`
- `control.color.danger`
- `control.color.border`
- `control.space.lg`
- `control.touch.min`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** confirmation-required, running, success, failed, disabled

**linkedPreviewSections:** S07, S08, S14, S15

**permissionDependencies:** agent-run

**actionDependencies:** cursor.agent.prompt.send

**blockingNotes:** NOT main navigation; subsystem badge MUST (VQ-003: text badge, no icon set)

**implementationNotesForLater:** Accordion/section per DEC-P2-013; prompt never plaintext in audit UI

---

### bridge.ui.audit.history

| Field | Value |
|-------|-------|
| **moduleName** | Audit History |
| **runtimeStatus** | proposed |
| **riskLevel** | read-only |
| **sourceProposal** | p1-ui-modules.proposal.json — category: audit |

**requiredComponents:**
- `control.component.list.auditRow`
- `control.component.badge.risk`
- `control.component.list.empty`
- `control.component.skeleton.block`
- `control.component.errorInline`
- `control.pattern.loading.skeleton`

**requiredDesignTokens:**
- `control.color.surface`
- `control.color.textMuted`
- `control.color.danger`
- `control.color.warn`
- `control.space.sm`
- `control.type.caption.size`
- `control.type.caption.weight`
- `control.type.mono.family`
- `control.type.mono.size`

**requiredStates:** loading, empty, error

**linkedPreviewSections:** S10

**permissionDependencies:** read

**actionDependencies:** GET /api/v1/cursor/audit

**blockingNotes:** No plaintext secrets; riskClass column required

**implementationNotesForLater:** Newest first; vertical list on mobile

---

### bridge.ui.version.info

| Field | Value |
|-------|-------|
| **moduleName** | Version Info |
| **runtimeStatus** | proposed |
| **riskLevel** | low |
| **sourceProposal** | p1-ui-modules.proposal.json — category: meta |

**requiredComponents:**
- `control.component.footer.meta`

**requiredDesignTokens:**
- `control.color.textMuted`
- `control.type.caption.size`
- `control.type.caption.weight`
- `control.space.sm`

**requiredStates:** loading, error

**linkedPreviewSections:** S11, S16

**permissionDependencies:** read

**actionDependencies:** GET /api/v1/cursor/version

**blockingNotes:** Must show snapshotRestoreAvailable truthfully from API

**implementationNotesForLater:** Footer placement at stack bottom

---

### bridge.ui.confirmation.dialog

| Field | Value |
|-------|-------|
| **moduleName** | Confirmation Dialog |
| **runtimeStatus** | proposed |
| **riskLevel** | inherit from action |
| **sourceProposal** | p1-ui-modules.proposal.json — category: cross-cutting |

**requiredComponents:**
- `control.component.dialog.confirm`
- `control.component.dialog.sheet`
- `control.component.riskBanner.externalCode`
- `control.component.riskBanner.destructive`
- `control.component.button.danger`
- `control.component.button.secondary`
- `control.pattern.confirm.destructive`
- `control.pattern.confirm.externalCode`
- `control.pattern.confirm.restore`
- `control.pattern.confirm.normal`
- `control.pattern.loading.spinnerInline`

**requiredDesignTokens:**
- `control.color.surfaceElevated`
- `control.color.danger`
- `control.color.warn`
- `control.color.text`
- `control.color.border`
- `control.radius.xl`
- `control.space.lg`
- `control.touch.min`
- `control.type.label.size`
- `control.type.label.weight`
- `control.type.body.size`
- `control.type.body.weight`

**requiredStates:** confirmation-required, loading, disabled

**linkedPreviewSections:** S08, S15

**permissionDependencies:** —

**actionDependencies:** — (cross-cutting; bound by action modules)

**blockingNotes:** restore pattern only when rollbackAvailable true (BN-007)

**implementationNotesForLater:** emits confirmed:true; fullscreenOnSmall per mobile rules

---

### bridge.ui.action.result

| Field | Value |
|-------|-------|
| **moduleName** | Action Result |
| **runtimeStatus** | proposed |
| **riskLevel** | n/a |
| **sourceProposal** | p1-ui-modules.proposal.json — category: cross-cutting |

**requiredComponents:**
- `control.component.actionResult.toast`
- `control.component.actionResult.detail`
- `control.component.badge.risk`

**requiredDesignTokens:**
- `control.color.ok`
- `control.color.warn`
- `control.color.surfaceElevated`
- `control.space.md`
- `control.type.body.size`
- `control.type.body.weight`
- `control.type.mono.family`
- `control.type.mono.size`

**requiredStates:** success, warning, partial-success, restore-available, restore-unavailable

**linkedPreviewSections:** S06, S12

**permissionDependencies:** —

**actionDependencies:** — (displays ActionResult from any action)

**blockingNotes:** Never show rollback button when rollbackAvailable false (BN-007)

**implementationNotesForLater:** snapshotId visible without false restore promise; link to audit entry

---

### bridge.ui.error.state

| Field | Value |
|-------|-------|
| **moduleName** | Error State |
| **runtimeStatus** | proposed |
| **riskLevel** | n/a |
| **sourceProposal** | p1-ui-modules.proposal.json — category: cross-cutting |

**requiredComponents:**
- `control.component.errorInline`
- `control.component.errorBlocked`
- `control.component.button.secondary`

**requiredDesignTokens:**
- `control.color.danger`
- `control.color.text`
- `control.color.textMuted`
- `control.space.md`
- `control.type.body.size`
- `control.type.body.weight`
- `control.type.label.size`
- `control.type.label.weight`

**requiredStates:** error, blocked, permission-denied, offline, unreachable

**linkedPreviewSections:** S06, S09, S17

**permissionDependencies:** —

**actionDependencies:** — (maps CursorErrorCode: CONFIRMATION_REQUIRED, PERMISSION_DENIED, ALLOWLIST_VIOLATION, ROLLBACK_NOT_AVAILABLE, EXTENSION_UNREACHABLE)

**blockingNotes:** —

**implementationNotesForLater:** Central mapper; referenced by other modules via useModule bridge.ui.error.state

---

## Validation matrix

| moduleId | components OK | tokens OK | preview OK | empty arrays |
|----------|---------------|-----------|------------|--------------|
| bridge.ui.permission.gate | ✓ | ✓ | ✓ | none |
| bridge.ui.cursor.status | ✓ | ✓ | ✓ | none |
| bridge.ui.workspace | ✓ | ✓ | ✓ | none |
| bridge.ui.editor | ✓ | ✓ | ✓ | none |
| bridge.ui.file.create | ✓ | ✓ | ✓ | none |
| bridge.ui.settings | ✓ | ✓ | ✓ | none |
| bridge.ui.extension.install | ✓ | ✓ | ✓ | none |
| bridge.ui.terminal.command | ✓ | ✓ | ✓ | none |
| bridge.ui.ide.command | ✓ | ✓ | ✓ | none |
| bridge.ui.panels | ✓ | ✓ | ✓ | none |
| bridge.ui.git.status | ✓ | ✓ | ✓ | none |
| bridge.ui.problems | ✓ | ✓ | ✓ | none |
| bridge.ui.agent.prompt | ✓ | ✓ | ✓ | none |
| bridge.ui.audit.history | ✓ | ✓ | ✓ | none |
| bridge.ui.version.info | ✓ | ✓ | ✓ | none |
| bridge.ui.confirmation.dialog | ✓ | ✓ | ✓ | none |
| bridge.ui.action.result | ✓ | ✓ | ✓ | none |
| bridge.ui.error.state | ✓ | ✓ | ✓ | none |

**Module count:** 18 / 18 (matches p1-ui-modules.proposal.json)

---

## Explicit non-changes (P2.0-pre)

The following were **NOT modified** in P2.0-pre:

- adapters/cursor/registry/p1-ui-modules.proposal.json
- adapters/cursor/registry/poc-v1-ui-modules.json (does not exist)
- docs/global-design/control-rules/tokens/control.tokens.json
- docs/global-design/control-rules/preview/static/*
- web/, api/, packages/, extension/, adapters/cursor/src/
- .github/workflows/*
