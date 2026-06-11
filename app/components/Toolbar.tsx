"use client";

import { Search, Plus, Sun, Moon, Keyboard } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTheme } from "./providers/ThemeProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Toolbar() {
  const {
    vimMode,
    toggleVimMode,
    setSearchOpen,
    addNote,
    shortcutsOpen,
    setShortcutsOpen,
  } = useStore();
  const { resolvedTheme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <div
        className="fixed bottom-5 right-5 flex items-center gap-0.5 bg-toolbar-bg border border-toolbar-border rounded-[10px] shadow-toolbar p-1 z-[200]"
        role="toolbar"
        aria-label="Canvas controls"
      >
        <Tooltip>
          <TooltipTrigger
            className="flex items-center justify-center w-[34px] h-[34px] rounded-md border-none bg-transparent text-text-muted cursor-pointer hover:bg-search-result-hover hover:text-text-primary transition-colors duration-[80ms]"
            onClick={() => setSearchOpen(true)}
            aria-label="Search notes"
          >
            <Search size={15} strokeWidth={1.6} />
          </TooltipTrigger>
          <TooltipContent side="top">Search notes <kbd className="ml-1 text-[10px] opacity-60">⌘F</kbd></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className="flex items-center justify-center w-[34px] h-[34px] rounded-md border-none bg-transparent text-text-muted cursor-pointer hover:bg-search-result-hover hover:text-text-primary transition-colors duration-[80ms]"
            onClick={() => addNote("")}
            aria-label="New note"
          >
            <Plus size={15} strokeWidth={1.8} />
          </TooltipTrigger>
          <TooltipContent side="top">New note <kbd className="ml-1 text-[10px] opacity-60">⌘N</kbd></TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-toolbar-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger
            className="flex items-center justify-center w-[34px] h-[34px] rounded-md border-none bg-transparent text-text-muted cursor-pointer hover:bg-search-result-hover hover:text-text-primary transition-colors duration-[80ms]"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun size={15} strokeWidth={1.5} />
            ) : (
              <Moon size={15} strokeWidth={1.5} />
            )}
          </TooltipTrigger>
          <TooltipContent side="top">
            {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className={`flex items-center justify-center h-[34px] rounded-md border-none bg-transparent cursor-pointer font-mono text-[10px] font-semibold tracking-[0.08em] px-2 transition-colors duration-[80ms] ${
              vimMode
                ? "text-brand bg-brand-light"
                : "text-text-muted hover:bg-search-result-hover hover:text-text-primary"
            }`}
            onClick={toggleVimMode}
            aria-label="Toggle Vim mode"
            aria-pressed={vimMode}
          >
            VIM
          </TooltipTrigger>
          <TooltipContent side="top">
            {vimMode ? "Vim mode on" : "Vim mode off"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className="flex items-center justify-center w-[34px] h-[34px] rounded-md border-none bg-transparent text-text-muted cursor-pointer hover:bg-search-result-hover hover:text-text-primary transition-colors duration-[80ms]"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
          >
            <Keyboard size={15} strokeWidth={1.5} />
          </TooltipTrigger>
          <TooltipContent side="top">Keyboard shortcuts</TooltipContent>
        </Tooltip>
      </div>

      {shortcutsOpen && (
        <div
          className="fixed inset-0 bg-overlay-bg z-[500] flex items-center justify-center animate-[overlay-in_100ms_ease]"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="bg-search-bg border border-search-border rounded-[10px] shadow-search-panel w-[380px] max-w-[calc(100vw-32px)] overflow-hidden animate-[search-panel-in_120ms_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-search-border">
              <span className="font-mono text-xs text-text-muted">
                keyboard shortcuts
              </span>
              <button
                className="bg-none border-none text-text-muted cursor-pointer text-sm py-0.5 px-1"
                onClick={() => setShortcutsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-2">
              {SHORTCUTS.map(({ key, action }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 px-2 py-2 rounded hover:bg-search-result-hover"
                >
                  <kbd className="font-mono text-[11px] bg-canvas-bg border border-search-border rounded px-[7px] py-0.5 min-w-[120px] text-center text-text-secondary">
                    {key}
                  </kbd>
                  <span className="font-mono text-xs text-text-primary">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const SHORTCUTS = [
  { key: "Ctrl/⌘ + V", action: "Paste as new note" },
  { key: "Ctrl/⌘ + N", action: "New empty note" },
  { key: "Ctrl/⌘ + F", action: "Search notes" },
  { key: "Ctrl/⌘ + K", action: "Command palette" },
  { key: "Double-click canvas", action: "New note here" },
  { key: "Double-click note", action: "Edit note" },
  { key: "Enter (selected)", action: "Edit note" },
  { key: "Escape", action: "Exit edit / deselect" },
  { key: "Delete (selected)", action: "Delete note" },
  { key: "Right-click note", action: "Color & options menu" },
  { key: "Scroll", action: "Pan canvas" },
  { key: "Ctrl + Scroll", action: "Zoom canvas" },
  { key: "Space + drag", action: "Pan canvas" },
  { key: "Middle-drag", action: "Pan canvas" },
];
