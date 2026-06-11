"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useTheme } from "./providers/ThemeProvider";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette() {
  const {
    addNote,
    setCommandPaletteOpen,
    setSearchOpen,
    toggleVimMode,
    vimMode,
    notes,
    setViewport,
    setShortcutsOpen,
  } = useStore();
  const { resolvedTheme, setTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: "new-note",
      label: "New note",
      shortcut: "⌘N",
      action: () => {
        addNote("");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "search",
      label: "Search notes",
      shortcut: "⌘F",
      action: () => {
        setSearchOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-theme",
      label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`,
      action: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-vim",
      label: `${vimMode ? "Disable" : "Enable"} Vim mode`,
      action: () => {
        toggleVimMode();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "reset-viewport",
      label: "Reset canvas view",
      action: () => {
        setViewport({ x: 0, y: 0, zoom: 1 });
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "shortcuts",
      label: "Show keyboard shortcuts",
      action: () => {
        setShortcutsOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "export-json",
      label: "Export notes as JSON",
      action: () => {
        const data = JSON.stringify(notes, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `slate-board-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const run = useCallback((cmd: Command) => {
    cmd.action();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[activeIndex]) {
      run(filtered[activeIndex]);
    }
    if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-overlay-bg z-[500] flex items-start justify-center pt-20 animate-[overlay-in_100ms_ease]"
      onClick={() => setCommandPaletteOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="bg-search-bg border border-search-border rounded-[10px] shadow-search-panel w-[480px] max-w-[calc(100vw-32px)] overflow-hidden animate-[search-panel-in_120ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-search-border">
          <span className="font-mono text-sm text-accent font-medium">
            &gt;
          </span>
          <input
            ref={inputRef}
            id="command-palette-input"
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-text-primary caret-accent placeholder:text-text-placeholder"
            type="text"
            placeholder="type a command…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        <div className="p-1" role="listbox">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`flex items-center justify-between w-full text-left bg-transparent border-none rounded-md py-[9px] px-3 font-mono text-xs text-text-primary cursor-pointer transition-colors duration-[60ms] ${
                i === activeIndex
                  ? "bg-search-result-hover"
                  : "hover:bg-search-result-hover"
              }`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => run(cmd)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="font-mono text-[11px] text-text-muted bg-canvas-bg border border-search-border rounded px-1.5 py-px">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-5 text-center font-mono text-xs text-text-muted">
              no commands match
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
