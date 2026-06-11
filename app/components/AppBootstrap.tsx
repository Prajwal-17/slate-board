"use client";

import { getAllNotes, getSettings } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";
import { useTheme } from "./providers/ThemeProvider";

export default function AppBootstrap() {
  const { init, initialized, theme } = useStore();
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [notes, settings] = await Promise.all([
          getAllNotes(),
          getSettings(),
        ]);
        init(notes, settings);
        // Sync stored theme with ThemeProvider
        setTheme(settings.theme);
      } catch (err) {
        console.error("Failed to initialize Slate Board:", err);
        init([], {
          vimMode: false,
          theme: "system",
          canvasX: 0,
          canvasY: 0,
          canvasZoom: 1,
        });
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [init, setTheme]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-canvas-bg">
        <span className="font-mono text-sm font-light tracking-[0.12em] text-text-placeholder">
          slate board
        </span>
      </div>
    );
  }

  return <Canvas />;
}
