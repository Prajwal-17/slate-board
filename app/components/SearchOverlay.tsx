"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { getContentPreview } from "@/lib/utils";

export default function SearchOverlay() {
  const { notes, setSearchOpen, setViewport, viewport, selectNote } =
    useStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? notes.filter((n) => n.content.toLowerCase().includes(query.toLowerCase()))
    : notes.slice(0, 8);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const navigateToNote = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const vpX =
        window.innerWidth / 2 -
        note.x * viewport.zoom -
        (note.width * viewport.zoom) / 2;
      const vpY =
        window.innerHeight / 2 - note.y * viewport.zoom - 60 * viewport.zoom;

      setViewport({ ...viewport, x: vpX, y: vpY });
      selectNote(noteId);
      setSearchOpen(false);
    },
    [notes, viewport, setViewport, selectNote, setSearchOpen],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && results[activeIndex]) {
      navigateToNote(results[activeIndex].id);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const active = container.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-brand-light text-brand rounded-sm px-px">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-overlay-bg z-[500] flex items-start justify-center pt-20 animate-[overlay-in_100ms_ease]"
      onClick={() => setSearchOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search notes"
    >
      <div
        className="bg-search-bg border border-search-border rounded-[10px] shadow-search-panel w-[560px] max-w-[calc(100vw-32px)] overflow-hidden animate-[search-panel-in_120ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-search-border">
          <Search
            size={16}
            strokeWidth={1.5}
            className="text-text-muted shrink-0"
          />
          <input
            ref={inputRef}
            id="search-input"
            className="flex-1 bg-transparent border-none outline-none font-mono text-[15px] text-text-primary caret-accent placeholder:text-text-placeholder"
            type="text"
            placeholder="search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd
            className="font-mono text-[11px] text-text-placeholder bg-canvas-bg border border-search-border rounded px-1.5 py-0.5 cursor-pointer"
            onClick={() => setSearchOpen(false)}
          >
            esc
          </kbd>
        </div>

        {results.length > 0 && (
          <div
            ref={resultsRef}
            className="max-h-80 overflow-y-auto"
            role="listbox"
          >
            {results.map((note, i) => {
              const preview = getContentPreview(note.content);
              const isActive = i === activeIndex;
              return (
                <div
                  key={note.id}
                  data-index={i}
                  className={`flex items-baseline gap-2 px-4 py-2.5 cursor-pointer transition-colors duration-[60ms] ${
                    isActive
                      ? "bg-search-result-hover"
                      : "hover:bg-search-result-hover"
                  }`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => navigateToNote(note.id)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="flex-1 font-mono text-xs text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                    {highlightMatch(preview || "(empty note)", query)}
                  </span>
                  <span className="font-mono text-[11px] text-text-placeholder whitespace-nowrap shrink-0">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="py-6 px-4 text-center font-mono text-xs text-text-muted">
            no notes match &ldquo;{query}&rdquo;
          </div>
        )}

        <div className="flex gap-4 px-4 py-2 border-t border-search-border font-mono text-[11px] text-text-placeholder">
          <span>↑↓ navigate</span>
          <span>↵ go to note</span>
          <span className="ml-auto">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
