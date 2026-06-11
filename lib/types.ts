export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: "settings";
  theme: "light" | "dark" | "system";
  vimMode: boolean;
  canvasX: number;
  canvasY: number;
  canvasZoom: number;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export type ThemeMode = "light" | "dark" | "system";
