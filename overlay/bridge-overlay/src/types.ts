export interface GuiRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuiNode {
  id: string;
  name: string;
  controlType: string;
  automationId: string;
  className: string;
  bounds: GuiRect;
  enabled: boolean;
  visible: boolean;
  children: GuiNode[];
}

export interface GuiSnapshot {
  key: string;
  version: number;
  fingerprint: string;
  processName: string;
  processId: number;
  windowTitle: string;
  windowClass: string;
  windowBounds: GuiRect;
  capturedAt: string;
  nodes: GuiNode[];
}

export interface WindowInfo {
  processId: number;
  processName: string;
  title: string;
  className: string;
  bounds: GuiRect;
}

export interface AiAction {
  action: "click" | "type" | "focus" | "scroll" | "prompt";
  target?: string;
  automationId?: string;
  text?: string;
  prompt?: string;
}
