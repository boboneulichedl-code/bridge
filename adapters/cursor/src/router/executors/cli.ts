import { spawn } from "node:child_process";
import { appendMaxAccessAgentFlags, isMaxAccessEnabled } from "@bridge/shared";
import type { ActionExecutor, ActionResult, ExecutionContext } from "../../types/action";

export type RunCommandResult = { stdout: string; code: number };

export type RunCommandFn = (
  bin: string,
  args: string[],
  cwd: string
) => Promise<RunCommandResult>;

function defaultRunCommand(
  bin: string,
  args: string[],
  cwd: string
): Promise<RunCommandResult> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd,
      shell: process.platform === "win32",
      env: process.env,
    });
    let stdout = "";
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.on("error", () => resolve({ stdout, code: 1 }));
    child.on("close", (code) => resolve({ stdout, code: code ?? 1 }));
  });
}

async function runAgentPrompt(
  ctx: ExecutionContext,
  runCommand: RunCommandFn
): Promise<ActionResult> {
  const prompt = String(ctx.params.prompt ?? "");
  const mode = ctx.params.mode as string | undefined;
  const allowFileChanges = ctx.params.allowFileChanges === true;
  const maxAccess = isMaxAccessEnabled(ctx.cwd) && allowFileChanges;

  let args = ["-p", "--output-format", "text"];
  if (mode) args.push(`--mode=${mode}`);
  if (maxAccess) args.push("--force", "--trust", "--approve-mcps");
  args = appendMaxAccessAgentFlags(args, maxAccess);
  args.push(prompt);

  const bin =
    process.env.BRIDGE_AGENT_BIN || (process.platform === "win32" ? "agent.exe" : "agent");
  const result = await runCommand(bin, args, ctx.cwd);
  return {
    ok: result.code === 0,
    data: { output: result.stdout, jobId: ctx.requestId },
    error: result.code === 0 ? undefined : result.stdout || "Agent CLI failed",
    methodUsed: "cli",
  };
}

async function runCursorCli(
  ctx: ExecutionContext,
  runCommand: RunCommandFn
): Promise<ActionResult> {
  const bin = process.env.BRIDGE_CURSOR_BIN || "cursor";
  const actionId = ctx.actionId;

  if (actionId === "cursor.ide.status.get") {
    const proc = await runCommand(
      process.platform === "win32" ? "tasklist" : "pgrep",
      process.platform === "win32" ? ["/FI", "IMAGENAME eq Cursor.exe"] : ["-f", "Cursor"],
      ctx.cwd
    );
    const version = await runCommand(bin, ["--version"], ctx.cwd);
    return {
      ok: true,
      data: {
        cursor: { running: /Cursor/i.test(proc.stdout), version: version.stdout.trim() },
        extensionUnreachable: true,
      },
      methodUsed: "cli",
    };
  }

  if (actionId === "cursor.ide.workspace.open") {
    const p = String(ctx.params.path ?? "");
    const result = await runCommand(bin, [p], ctx.cwd);
    return {
      ok: result.code === 0,
      data: { path: p },
      error: result.code === 0 ? undefined : result.stdout,
      methodUsed: "cli",
    };
  }

  if (actionId === "cursor.ide.extension.install") {
    const id = String(ctx.params.extensionId ?? "");
    const args = ["--install-extension", id];
    if (ctx.params.preRelease) args.push("--pre-release");
    const result = await runCommand(bin, args, ctx.cwd);
    return {
      ok: result.code === 0,
      data: { extensionId: id },
      error: result.code === 0 ? undefined : result.stdout,
      methodUsed: "cli",
    };
  }

  return {
    ok: false,
    error: "CLI executor does not support this action",
    methodUsed: "cli",
  };
}

export function createCliExecutor(deps?: { runCommand?: RunCommandFn }): ActionExecutor {
  const runCommand = deps?.runCommand ?? defaultRunCommand;

  return {
    method: "cli",
    async canExecute(ctx) {
      if (ctx.actionId === "cursor.agent.prompt.send") return true;
      if (ctx.forceCli) return true;
      return ctx.action.fallbackMethods.some((f) => f.method === "cli");
    },
    async execute(ctx): Promise<ActionResult> {
      if (ctx.actionId === "cursor.agent.prompt.send") {
        return runAgentPrompt(ctx, runCommand);
      }
      return runCursorCli(ctx, runCommand);
    },
  };
}
