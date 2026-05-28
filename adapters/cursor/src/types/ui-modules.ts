export const UI_RISK_LEVEL_VALUES = [
  "n/a",
  "read-only",
  "low",
  "normal",
  "medium",
  "medium-high",
  "high",
  "destructive",
  "external-code",
  "inherit",
] as const;

export const RISK_VISIBILITY_VALUES = [
  "none",
  "badge",
  "banner",
  "confirmation",
  "blocked",
] as const;

export type UiRiskLevel = (typeof UI_RISK_LEVEL_VALUES)[number];
export type RiskVisibility = (typeof RISK_VISIBILITY_VALUES)[number];

export interface RollbackUndoVisibility {
  visible: boolean;
  reason?: string;
}

export interface UiModuleEntry {
  moduleId: string;
  moduleVersion: string;
  enabled: boolean;
  category: string;
  uiRiskLevel: UiRiskLevel;
  riskVisibility: RiskVisibility;
  requiredPermissions: string[];
  supportedActions: string[];
  requiredDesignTokens: string[];
  requiredComponents: string[];
  requiredStates: string[];
  linkedPreviewSections: string[];
  implementationPhase: string;
  rollbackUndoVisibility?: RollbackUndoVisibility;
}

export interface UiModulesViewComposition {
  viewId: string;
  layout: string;
  forbidden: string;
  moduleOrder: string[];
  crossCuttingModules: string[];
}

export interface UiModulesRegistry {
  schemaVersion: string;
  registryVersion: string;
  adapterId: string;
  runtimeActive: boolean;
  designrulesStatus: string;
  linkedCatalog: string;
  linkedCrosswalk: string;
  viewComposition: UiModulesViewComposition;
  modules: UiModuleEntry[];
}
