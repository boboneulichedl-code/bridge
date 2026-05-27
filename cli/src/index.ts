#!/usr/bin/env node

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs, printHelp, SHORTCUTS_TEXT } from "./help";
import {
  appendMaxAccessAgentFlags,
  isMaxAccessEnabled,
} from "@bridge/shared";
import { cmdMaxAccess } from "./max-access";
import { cmdUpdate } from "./update";
import {
  cmdInstallMcp,
  cmdInstallAll,
  cmdInvestigate,
  cmdManifest,
  cmdPluginsGuide,
  cmdPluginsList,
  cmdRoute,
} from "./plugins";

function findAgentBinary(): string {
  if (process.env.BRIDGE_AGENT_BIN) {
    return process.env.BRIDGE_AGENT_BIN;
  }
  return process.platform === "win32" ? "agent.exe" : "agent";
}

function runAgent(args: string[], options?: { inherit?: boolean }): Promise<number> {
  const bin = findAgentBinary();
  const inherit = options?.inherit ?? true;

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: inherit ? "inherit" : "pipe",
      shell: process.platform === "win32",
      env: process.env,
      cwd: process.cwd(),
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        console.error(
          "Fehler: 'agent' nicht gefunden. Installiere die Cursor CLI:\n" +
            "  curl https://cursor.com/install -fsS | bash\n" +
            "Oder setze BRIDGE_AGENT_BIN auf den Pfad zur agent-Binary."
        );
        resolve(1);
        return;
      }
      reject(err);
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

function runCursor(args: string[]): Promise<number> {
  const bin = process.platform === "win32" ? "cursor.cmd" : "cursor";
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", () => {
      console.error("Fehler: 'cursor' CLI nicht gefunden.");
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function cmdPrompt(rest: string[]): Promise<number> {
  const { flags, positional } = parseArgs(rest);
  const prompt = positional.join(" ").trim();

  if (!prompt) {
    console.error("Verwendung: bridge prompt \"Deine Aufgabe\" [--print] [--force] [--mode agent|plan|ask]");
    return 1;
  }

  const maxAccess = !flags.safe && (flags.maxAccess ?? isMaxAccessEnabled());

  const args: string[] = [];
  if (flags.mode) {
    args.push(`--mode=${flags.mode}`);
  }
  if (flags.print) {
    args.push("-p", "--output-format", flags.format ?? "text");
  }
  if (flags.force || maxAccess) {
    args.push("--force");
  }
  if (flags.trust || maxAccess) {
    args.push("--trust");
  }
  if (maxAccess) {
    args.push("--approve-mcps");
  }
  if (flags.worktree) {
    args.push("--worktree");
  }
  if (flags.workspace) {
    args.push("--workspace", flags.workspace);
  }
  if (flags.resume) {
    args.push("--resume", flags.resume);
  }
  if (flags.continue) {
    args.push("--continue");
  }

  args.push(prompt);
  return runAgent(appendMaxAccessAgentFlags(args, maxAccess && !flags.safe));
}

async function cmdSessions(): Promise<number> {
  return runAgent(["ls"]);
}

async function cmdResume(rest: string[]): Promise<number> {
  const id = rest.join(" ").trim();
  if (id) {
    return runAgent(["--resume", id]);
  }
  return runAgent(["resume"]);
}

async function cmdOpen(target: string): Promise<number> {
  switch (target) {
    case "composer":
      return runCursor(["--command", "composer.openComposer"]);
    case "chat":
      return runCursor(["--command", "workbench.action.chat.open"]);
    case "agent":
    case "agent-chat":
      return runCursor(["--command", "composer.newAgentChat"]);
    case "fullscreen":
      return runCursor(["--command", "composer.openComposerFullscreen"]);
    default:
      console.error(`Unbekanntes Ziel: ${target}. Nutze: composer|chat|agent|fullscreen`);
      return 1;
  }
}

async function cmdAcp(): Promise<number> {
  return runAgent(["acp"]);
}

async function cmdConfig(action: string, rest: string[]): Promise<number> {
  const configPath = path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".cursor",
    "cli-config.json"
  );

  if (action === "show") {
    if (fs.existsSync(configPath)) {
      console.log(fs.readFileSync(configPath, "utf8"));
    } else {
      console.log("{}");
    }
    return 0;
  }

  if (action === "set-statusline") {
    const script = rest[0] || path.join(__dirname, "..", "..", "scripts", "statusline.sh");
    const config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, "utf8"))
      : {};
    config.statusLine = {
      type: "command",
      command: script,
      padding: 2,
    };
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Statusline gesetzt: ${script}`);
    return 0;
  }

  console.error("Verwendung: bridge config show | bridge config set-statusline [script]");
  return 1;
}

async function cmdPluginsSub(rest: string[]): Promise<number> {
  const sub = rest[0] ?? "list";
  switch (sub) {
    case "list":
    case "ls":
      return cmdPluginsList();
    case "guide":
      return cmdPluginsGuide(rest[1] ?? "");
    case "install-mcp":
      return cmdInstallMcp(rest.includes("--dry-run"));
    case "install-all":
    case "install":
      return cmdInstallAll(rest.includes("--dry-run"));
    default:
      console.error("Verwendung: bridge plugins list|guide <id>|install-mcp|install-all [--dry-run]");
      return 1;
  }
}

async function main(): Promise<number> {
  const [, , command, ...rest] = process.argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }

  switch (command) {
    case "prompt":
    case "p":
      return cmdPrompt(rest);
    case "sessions":
    case "ls":
      return cmdSessions();
    case "resume":
    case "continue":
      return cmdResume(rest);
    case "shortcuts":
    case "keys":
      console.log(SHORTCUTS_TEXT);
      return 0;
    case "open":
      return cmdOpen(rest[0] ?? "");
    case "acp":
      return cmdAcp();
    case "config":
      return cmdConfig(rest[0] ?? "", rest.slice(1));
    case "agent":
      return runAgent(rest);
    case "plugins":
      return cmdPluginsSub(rest);
    case "route":
      return cmdRoute(rest[0] ?? "", rest.slice(1).join(" ") || undefined);
    case "investigate":
      return cmdInvestigate(rest.join(" "));
    case "manifest":
      return Promise.resolve(cmdManifest());
    case "max-access":
      return Promise.resolve(
        cmdMaxAccess(rest[0] ?? "status", path.resolve(__dirname, "..", ".."))
      );
    case "update":
      return cmdUpdate(rest[0] ?? "check", path.resolve(__dirname, "..", ".."));
    case "serve": {
      const apiServer = path.join(__dirname, "..", "..", "api", "dist", "server.js");
      if (!fs.existsSync(apiServer)) {
        console.error("API nicht gebaut. Führe npm run build aus.");
        return Promise.resolve(1);
      }
      const child = spawn(process.execPath, [apiServer], {
        stdio: "inherit",
        env: { ...process.env, BRIDGE_API_PORT: process.env.BRIDGE_API_PORT || "3847" },
      });
      return new Promise((resolve) => {
        child.on("close", (code) => resolve(code ?? 0));
      });
    }
    default:
      console.error(`Unbekannter Befehl: ${command}\n`);
      printHelp();
      return 1;
  }
}

main().then((code) => process.exit(code));
