/** Max Access markers for Android Studio (separate from Cursor .cursor/ path). */

export const STUDIO_MAX_ACCESS_MARKER = ".idea/bridge-max-access.json";
export const STUDIO_MAX_ACCESS_ENV = "BRIDGE_STUDIO_MAX_ACCESS";
export const STUDIO_AUTONOMOUS_ENV = "BRIDGE_STUDIO_AUTONOMOUS";

export interface StudioMaxAccessMarker {
  enabled: boolean;
  autonomous: boolean;
  via?: string;
  at: string;
}

export const DEFAULT_STUDIO_MAX_ACCESS: StudioMaxAccessMarker = {
  enabled: true,
  autonomous: true,
  via: "plugin-default",
  at: new Date(0).toISOString(),
};
