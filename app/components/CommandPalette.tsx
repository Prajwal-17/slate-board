'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useTheme } from './providers/ThemeProvider';

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
    deleteNote,
    setViewport,
    viewport,
    setShortcutsOpen,
  } = useStore();
  const { resolvedTheme, setTheme } = useTheme();
  const { setTheme: storeSetTheme } = useStore();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'new-note',
      label: 'New note',
      shortcut: '⌘N',
      action: () => { addNote(''); setCommandPaletteOpen(false); },
    },
    {
      id: 'search',
      label: 'Search notes',
      shortcut: '⌘F',
      action: () => { setSearchOpen(true); setCommandPaletteOpen(false); },
    },
    {
      id: 'toggle-theme',
      label: `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`,
      action: () => {
        const next = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        storeSetTheme(next);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-vim',
      label: `${vimMode ? 'Disable' : 'Enable'} Vim mode`,
      action: () => { toggleVimMode(); setCommandPaletteOpen(false); },
    },
    {
      id: 'reset-viewport',
      label: 'Reset canvas view',
      action: () => { setViewport({ x: 0, y: 0, zoom: 1 }); setCommandPaletteOpen(false); },
    },
    {
      id: 'shortcuts',
      label: 'Show keyboard shortcuts',
      action: () => { setShortcutsOpen(true); setCommandPaletteOpen(false); },
    },
    {
      id: 'export-json',
      label: 'Export notes as JSON',
      action: () => {
        const data = JSON.stringify(notes, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slate-board-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const run = useCallback((cmd: Command) => {
    cmd.action();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filtered[activeIndex]) {
      run(filtered[activeIndex]);
    }
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="cmd-overlay"
      onClick={() => setCommandPaletteOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="cmd-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-input-row">
          <span className="cmd-prompt">&gt;</span>
          <input
            ref={inputRef}
            id="command-palette-input"
            className="cmd-input"
            type="text"
            placeholder="type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        <div className="cmd-list" role="listbox">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`cmd-item ${i === activeIndex ? 'active' : ''}`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => run(cmd)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && <kbd className="cmd-shortcut">{cmd.shortcut}</kbd>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="cmd-empty">no commands match</div>
          )}
        </div>
      </div>

      <style>{`
        .cmd-overlay {
          position: fixed;
          inset: 0;
          background: var(--overlay-bg);
          z-index: 500;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          animation: overlay-in 100ms ease;
        }
        .cmd-panel {
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 10px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
          width: 480px;
          max-width: calc(100vw - 32px);
          overflow: hidden;
          animation: search-panel-in 120ms ease;
        }
        .cmd-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--search-border);
        }
        .cmd-prompt {
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--accent);
          font-weight: 500;
        }
        .cmd-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--text-primary);
          caret-color: var(--accent);
        }
        .cmd-input::placeholder { color: var(--text-placeholder); }
        .cmd-list { padding: 4px; }
        .cmd-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          border-radius: 6px;
          padding: 9px 12px;
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          cursor: pointer;
          transition: background 60ms;
        }
        .cmd-item:hover, .cmd-item.active {
          background: var(--search-result-hover);
        }
        .cmd-shortcut {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-muted);
          background: var(--canvas-bg);
          border: 1px solid var(--search-border);
          border-radius: 3px;
          padding: 1px 5px;
        }
        .cmd-empty {
          padding: 20px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
