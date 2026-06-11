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
      <div className="loading-screen">
        <span className="loading-wordmark">slate board</span>
        <style>{`
          .loading-screen {
            position: fixed;
            inset: 0;
            background: var(--canvas-bg);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-wordmark {
            font-family: var(--font-mono);
            font-size: 14px;
            font-weight: 300;
            letter-spacing: 0.12em;
            color: var(--text-placeholder);
          }
        `}</style>
      </div>
    );
  }

  return <Canvas />;
}
