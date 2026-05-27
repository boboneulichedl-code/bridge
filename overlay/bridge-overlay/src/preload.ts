import { contextBridge, ipcRenderer } from "electron";
import type { GuiSnapshot } from "./types";

contextBridge.exposeInMainWorld("bridgeOverlay", {
  onGuiUpdate: (cb: (s: GuiSnapshot) => void) => {
    ipcRenderer.on("gui-update", (_e, s) => cb(s));
  },
  getConfig: () => ipcRenderer.invoke("get-config"),
  setConfig: (patch: unknown) => ipcRenderer.invoke("set-config", patch),
  forceRefresh: () => ipcRenderer.invoke("force-refresh"),
  aiCommand: (prompt: string) => ipcRenderer.invoke("ai-command", prompt),
  control: (action: unknown) => ipcRenderer.invoke("control", action),
});
