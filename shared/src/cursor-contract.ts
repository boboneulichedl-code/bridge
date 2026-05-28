/**
 * Bridge Cursor adapter — HTTP + IPC contracts for /api/v1/cursor/*
 *
 * Scope: P0 technical foundation (IDE/program control) plus P2 UI modules metadata (GET /ui-modules).
 *
 * Legacy separation:
 * - `/api/v1/prompt` (api-contract PromptRequest) = legacy orchestration
 * - `/api/v1/cursor/agent/prompt` (AgentPromptRequest) = P0 action 10 subsystem
 */

export const CURSOR_API_SPEC = "/api/v1/cursor" as const;

/** P0.1a: snapshot restore available for settings.set and fs.write (overwrite) */
export const P0_ROLLBACK_AVAILABLE = true as const;

/** Meta restore audit id — not in P0_ACTION_IDS / registry */
export const CURSOR_SNAPSHOT_RESTORE_ACTION_ID = "cursor.snapshots.restore" as const;

/** All 10 P0 action IDs — no others in this contract surface */
export const P0_ACTION_IDS = [
  "cursor.ide.status.get",
  "cursor.ide.workspace.open",
  "cursor.ide.fs.mkdir",
  "cursor.ide.fs.write",
  "cursor.ide.settings.get",
  "cursor.ide.settings.set",
  "cursor.ide.extension.install",
  "cursor.ide.terminal.run",
  "cursor.ide.command.execute",
  "cursor.agent.prompt.send",
] as const;

export type CursorActionId = (typeof P0_ACTION_IDS)[number];

export type ActionDomain = "ide" | "agent" | "config" | "integration";

export type ActionStability = "stable" | "probable" | "experimental" | "unsupported";

export type ActionMethod =
  | "extension-api"
  | "extension-command"
  | "cli"
  | "filesystem"
  | "composite";

export type ActionPermission =
  | "read"
  | "workspace"
  | "fs-write"
  | "fs-delete"
  | "settings"
  | "extension-manage"
  | "terminal"
  | "command-exec"
  | "agent-run";

export type AuditResult = "success" | "failure" | "blocked";

export type AuditRiskClass = "external-code" | "destructive" | "read";

export type CursorErrorCode =
  | "ACTION_UNKNOWN"
  | "VERSION_INCOMPATIBLE"
  | "PERMISSION_DENIED"
  | "CONFIRMATION_REQUIRED"
  | "ALLOWLIST_VIOLATION"
  | "EXTENSION_UNREACHABLE"
  | "METHOD_BLOCKED"
  | "ROLLBACK_NOT_AVAILABLE"
  | "SNAPSHOT_NOT_FOUND"
  | "SNAPSHOT_UNSUPPORTED";

/** Stable HTTP status hints for error codes (API layer may use these) */
export const CURSOR_ERROR_HTTP_STATUS: Record<CursorErrorCode, number> = {
  ACTION_UNKNOWN: 404,
  VERSION_INCOMPATIBLE: 409,
  PERMISSION_DENIED: 403,
  CONFIRMATION_REQUIRED: 428,
  ALLOWLIST_VIOLATION: 403,
  EXTENSION_UNREACHABLE: 503,
  METHOD_BLOCKED: 500,
  ROLLBACK_NOT_AVAILABLE: 501,
  SNAPSHOT_NOT_FOUND: 404,
  SNAPSHOT_UNSUPPORTED: 400,
};

/** Per-action or global rollback availability (P0.1a+) */
export type RollbackAvailableP0 = boolean;

/** Actions with restore implemented in P0.1a */
export const P0_RESTORE_ACTION_IDS = [
  "cursor.ide.settings.set",
  "cursor.ide.fs.write",
] as const;

export type RestoreableActionId = (typeof P0_RESTORE_ACTION_IDS)[number];

export function isRestoreableActionId(actionId: string): actionId is RestoreableActionId {
  return (P0_RESTORE_ACTION_IDS as readonly string[]).includes(actionId);
}

// ---------------------------------------------------------------------------
// Registry metadata (GET /api/v1/cursor/registry)
// ---------------------------------------------------------------------------

export interface CursorActionMeta {
  actionId: CursorActionId;
  domain: ActionDomain;
  method: ActionMethod;
  stability: ActionStability;
  requiredPermission: ActionPermission;
  destructive: boolean;
  needsConfirmation: boolean;
  /** fs.write: confirmation required when overwriteExisting is true */
  needsConfirmationOnOverwrite?: boolean;
  /** extension.install: third-party code */
  externalCode?: boolean;
  rollbackPossible: boolean;
  rollbackAvailable: RollbackAvailableP0;
}

export interface CursorRegistryResponse {
  registryVersion: string;
  adapterId: "cursor";
  rollbackAvailable: RollbackAvailableP0;
  actions: CursorActionMeta[];
}

// ---------------------------------------------------------------------------
// Version (GET /api/v1/cursor/version)
// ---------------------------------------------------------------------------

export interface CursorVersionResponse {
  registryVersion: string;
  extensionHostVersion?: string;
  cursorVersion?: string;
  compatibleActions: CursorActionId[];
  snapshotRestoreAvailable: RollbackAvailableP0;
  rollbackAvailable: RollbackAvailableP0;
}

// ---------------------------------------------------------------------------
// UI modules metadata (GET /api/v1/cursor/ui-modules)
// ---------------------------------------------------------------------------

export interface CursorUiModuleMeta {
  moduleId: string;
  moduleVersion: string;
  enabled: boolean;
  category: string;
  uiRiskLevel: string;
  riskVisibility: string;
  requiredPermissions: string[];
  supportedActions: string[];
  requiredDesignTokens: string[];
  requiredComponents: string[];
  requiredStates: string[];
  linkedPreviewSections: string[];
  implementationPhase: string;
  rollbackUndoVisibility?: { visible: boolean; reason?: string };
}

export interface CursorUiModulesViewComposition {
  viewId: string;
  layout: string;
  forbidden: string;
  moduleOrder: string[];
  crossCuttingModules: string[];
}

export interface CursorUiModulesResponse {
  schemaVersion: string;
  registryVersion: string;
  adapterId: "cursor";
  runtimeActive: boolean;
  designrulesStatus: string;
  viewComposition: CursorUiModulesViewComposition;
  modules: CursorUiModuleMeta[];
}

// ---------------------------------------------------------------------------
// Action result envelope (all action endpoints)
// ---------------------------------------------------------------------------

export interface CursorActionResponse<TData = unknown> {
  ok: boolean;
  actionId: CursorActionId;
  data?: TData;
  error?: string;
  code?: CursorErrorCode;
  methodUsed?: ActionMethod;
  snapshotId?: string;
  /** Present for action 10 when executed via CLI */
  jobId?: string;
  rollbackAvailable: RollbackAvailableP0;
}

export interface CursorErrorResponse {
  ok: false;
  actionId?: CursorActionId;
  error: string;
  code: CursorErrorCode;
  rollbackAvailable: RollbackAvailableP0;
}

export interface CursorSnapshotRestoreRequest extends CursorConfirmedRequest {
  /** Optional — defaults to process.cwd() for settings FS fallback */
  cwd?: string;
}

export interface CursorSnapshotRestoreSuccess {
  ok: true;
  snapshotId: string;
  actionId: string;
  rollbackAvailable: true;
}

export interface CursorSnapshotRestoreFailure {
  ok: false;
  error: string;
  code: CursorErrorCode;
  rollbackAvailable: RollbackAvailableP0;
}

export type CursorSnapshotRestoreResponse =
  | CursorSnapshotRestoreSuccess
  | CursorSnapshotRestoreFailure;

// ---------------------------------------------------------------------------
// Per-action request types (10 P0 actions only)
// ---------------------------------------------------------------------------

export interface CursorConfirmedRequest {
  confirmed?: boolean;
}

export interface WorkspaceOpenRequest extends CursorConfirmedRequest {
  path: string;
  newWindow?: boolean;
}

export interface FsMkdirRequest {
  path: string;
}

export interface FsWriteRequest extends CursorConfirmedRequest {
  path: string;
  content: string;
  overwriteExisting?: boolean;
  openAfterWrite?: boolean;
}

export interface SettingsGetRequest {
  section: string;
  key: string;
  target?: "workspace" | "global" | "workspaceFolder";
}

export interface SettingsSetRequest extends CursorConfirmedRequest {
  section: string;
  key: string;
  value: unknown;
  target?: "workspace" | "global" | "workspaceFolder";
}

export interface ExtensionInstallRequest extends CursorConfirmedRequest {
  extensionId: string;
  preRelease?: boolean;
}

export interface TerminalRunRequest extends CursorConfirmedRequest {
  command: string;
  cwd?: string;
  terminalName?: string;
}

export interface CommandExecuteRequest extends CursorConfirmedRequest {
  commandId: string;
  args?: unknown[];
}

/** Agent subsystem — action 10 only; not the legacy /api/v1/prompt contract */
export interface AgentPromptRequest extends CursorConfirmedRequest {
  prompt: string;
  mode?: "agent" | "plan" | "ask";
  headless?: boolean;
  /** Default false — no --force on CLI without explicit opt-in */
  allowFileChanges?: boolean;
}

export type CursorActionRequestMap = {
  "cursor.ide.status.get": Record<string, never>;
  "cursor.ide.workspace.open": WorkspaceOpenRequest;
  "cursor.ide.fs.mkdir": FsMkdirRequest;
  "cursor.ide.fs.write": FsWriteRequest;
  "cursor.ide.settings.get": SettingsGetRequest;
  "cursor.ide.settings.set": SettingsSetRequest;
  "cursor.ide.extension.install": ExtensionInstallRequest;
  "cursor.ide.terminal.run": TerminalRunRequest;
  "cursor.ide.command.execute": CommandExecuteRequest;
  "cursor.agent.prompt.send": AgentPromptRequest;
};

// ---------------------------------------------------------------------------
// Per-action response data types
// ---------------------------------------------------------------------------

export interface IdeStatusData {
  cursor: { running: boolean; version?: string };
  workspace?: { folders: string[] };
  editor?: { activeFile: string; line: number } | null;
  problems?: { errors: number; warnings: number };
  terminals?: { count: number; names?: string[] };
  extensions?: { installed: number };
  openEditors?: number;
  extensionUnreachable?: boolean;
}

export interface WorkspaceOpenData {
  path: string;
  newWindow?: boolean;
}

export interface FsPathData {
  path: string;
}

export interface SettingsValueData {
  section: string;
  key: string;
  value: unknown;
  target?: string;
}

export interface ExtensionInstallData {
  extensionId: string;
  installed?: boolean;
}

export interface TerminalRunData {
  sent: boolean;
  command: string;
  terminalName?: string;
}

export interface CommandExecuteData {
  commandId: string;
  executed?: boolean;
}

export interface AgentPromptData {
  output?: string;
  sent?: boolean;
  via?: "cli" | "extension-command";
}

export type CursorActionDataMap = {
  "cursor.ide.status.get": IdeStatusData;
  "cursor.ide.workspace.open": WorkspaceOpenData;
  "cursor.ide.fs.mkdir": FsPathData;
  "cursor.ide.fs.write": FsPathData;
  "cursor.ide.settings.get": SettingsValueData;
  "cursor.ide.settings.set": SettingsValueData;
  "cursor.ide.extension.install": ExtensionInstallData;
  "cursor.ide.terminal.run": TerminalRunData;
  "cursor.ide.command.execute": CommandExecuteData;
  "cursor.agent.prompt.send": AgentPromptData;
};

export type CursorTypedActionResponse<T extends CursorActionId> = CursorActionResponse<
  CursorActionDataMap[T]
>;

// ---------------------------------------------------------------------------
// Audit (GET /api/v1/cursor/audit) — no sensitive plaintext fields
// ---------------------------------------------------------------------------

export interface CursorAuditEntry {
  id: string;
  actionId: CursorActionId;
  timestamp: string;
  clientId: string;
  paramsHash: string;
  result: AuditResult;
  methodUsed?: ActionMethod;
  durationMs: number;
  errorCode?: CursorErrorCode;
  snapshotId?: string;
  requestId?: string;
  riskClass?: AuditRiskClass;
  rollbackAvailable: RollbackAvailableP0;
  /** Only when BRIDGE_AUDIT_DEBUG=1; max 200 chars preview */
  debugPreview?: string;
}

export interface CursorAuditListResponse {
  entries: CursorAuditEntry[];
  limit: number;
}

// ---------------------------------------------------------------------------
// Extension IPC (127.0.0.1 only) — contract only; host impl in later steps
// ---------------------------------------------------------------------------

export interface IpcHealthResponse {
  ok: true;
  extensionVersion: string;
  cursorVersion?: string;
  pid: number;
  port: number;
}

export interface IpcExecuteRequest {
  actionId: CursorActionId;
  params: Record<string, unknown>;
  requestId: string;
}

export interface IpcExecuteResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
  snapshotPayload?: unknown;
}

export interface IpcRestoreRequest {
  actionId: string;
  payload: unknown;
  requestId: string;
}

export interface IpcRestoreResponse {
  ok: boolean;
  error?: string;
}

/** Discovery file in user config — never contains the token */
export interface IdeControlHandshake {
  port: number;
  pid: number;
  startedAt: string;
  tokenRef: "user-config";
  extensionVersion: string;
}

// ---------------------------------------------------------------------------
// Routes (10 actions + registry/version/audit/ui-modules/snapshot stub)
// ---------------------------------------------------------------------------

export const CURSOR_API_ROUTES = {
  registry: `${CURSOR_API_SPEC}/registry`,
  version: `${CURSOR_API_SPEC}/version`,
  audit: `${CURSOR_API_SPEC}/audit`,
  uiModules: `${CURSOR_API_SPEC}/ui-modules`,
  status: `${CURSOR_API_SPEC}/ide/status`,
  workspaceOpen: `${CURSOR_API_SPEC}/ide/workspace/open`,
  fsMkdir: `${CURSOR_API_SPEC}/ide/fs/mkdir`,
  fsWrite: `${CURSOR_API_SPEC}/ide/fs/write`,
  settingsGet: `${CURSOR_API_SPEC}/ide/settings/get`,
  settingsSet: `${CURSOR_API_SPEC}/ide/settings/set`,
  extensionInstall: `${CURSOR_API_SPEC}/ide/extension/install`,
  terminalRun: `${CURSOR_API_SPEC}/ide/terminal/run`,
  commandExecute: `${CURSOR_API_SPEC}/ide/command/execute`,
  agentPrompt: `${CURSOR_API_SPEC}/agent/prompt`,
  snapshotRestore: `${CURSOR_API_SPEC}/snapshots`,
} as const;

export const CURSOR_ACTION_ROUTE: Record<CursorActionId, string> = {
  "cursor.ide.status.get": CURSOR_API_ROUTES.status,
  "cursor.ide.workspace.open": CURSOR_API_ROUTES.workspaceOpen,
  "cursor.ide.fs.mkdir": CURSOR_API_ROUTES.fsMkdir,
  "cursor.ide.fs.write": CURSOR_API_ROUTES.fsWrite,
  "cursor.ide.settings.get": CURSOR_API_ROUTES.settingsGet,
  "cursor.ide.settings.set": CURSOR_API_ROUTES.settingsSet,
  "cursor.ide.extension.install": CURSOR_API_ROUTES.extensionInstall,
  "cursor.ide.terminal.run": CURSOR_API_ROUTES.terminalRun,
  "cursor.ide.command.execute": CURSOR_API_ROUTES.commandExecute,
  "cursor.agent.prompt.send": CURSOR_API_ROUTES.agentPrompt,
};

/** WebSocket event — no sensitive payload */
export type CursorWsEvent = {
  type: "cursor.action.done";
  actionId: CursorActionId;
  result: AuditResult;
  durationMs: number;
  riskClass?: AuditRiskClass;
};

export function isCursorActionId(value: string): value is CursorActionId {
  return (P0_ACTION_IDS as readonly string[]).includes(value);
}
