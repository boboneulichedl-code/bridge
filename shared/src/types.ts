export type IntegrationCategory =
  | "git"
  | "errors"
  | "logs"
  | "tables"
  | "android"
  | "browser"
  | "deploy"
  | "flags"
  | "design"
  | "agent";

export interface IntegrationTool {
  name: string;
  description: string;
  exampleArgs?: Record<string, unknown>;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  categories: IntegrationCategory[];
  /** MCP server key in ~/.cursor/mcp.json or Cursor plugin id */
  mcpServerKeys: string[];
  cursorPlugin?: string;
  authRequired: boolean;
  setupHint: string;
  tools: IntegrationTool[];
  /** Built-in: no MCP, use agent shell/read/lints */
  builtin?: boolean;
}

export interface RouteResult {
  intent: string;
  integrations: Array<{
    id: string;
    name: string;
    configured: boolean;
    priority: number;
    tools: IntegrationTool[];
    setupHint?: string;
  }>;
  localSteps: string[];
  suggestedPrompt: string;
}

export interface InvestigationPlan {
  topic: string;
  localContext: Record<string, string>;
  mcpSteps: Array<{
    integrationId: string;
    tool: string;
    args: Record<string, unknown>;
    reason: string;
  }>;
  agentPrompt: string;
}

export interface McpServerEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface McpConfig {
  mcpServers?: Record<string, McpServerEntry>;
}
