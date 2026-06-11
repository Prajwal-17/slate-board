'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useTheme } from './providers/ThemeProvider';

export default function Toolbar() {
  const { vimMode, toggleVimMode, setSearchOpen, addNote, shortcutsOpen, setShortcutsOpen } = useStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { setTheme: storeSetTheme } = useStore();

  const handleThemeToggle = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    storeSetTheme(next);
  };

  return (
    <>
      <div className="toolbar" role="toolbar" aria-label="Canvas controls">
        {/* Search */}
        <button
          id="toolbar-search"
          className="toolbar-btn"
          onClick={() => setSearchOpen(true)}
          title="Search notes (Ctrl+F)"
          aria-label="Search notes"
        >
          <SearchIcon />
        </button>

        {/* New note */}
        <button
          id="toolbar-new"
          className="toolbar-btn"
          onClick={() => addNote('')}
          title="New note (Ctrl+N)"
          aria-label="New note"
        >
          <PlusIcon />
        </button>

        <div className="toolbar-divider" />

        {/* Theme toggle */}
        <button
          id="toolbar-theme"
          className="toolbar-btn"
          onClick={handleThemeToggle}
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Vim toggle */}
        <button
          id="toolbar-vim"
          className={`toolbar-btn toolbar-btn--text ${vimMode ? 'active' : ''}`}
          onClick={toggleVimMode}
          title={vimMode ? 'Vim mode on — click to disable' : 'Enable Vim mode'}
          aria-label="Toggle Vim mode"
          aria-pressed={vimMode}
        >
          VIM
        </button>

        {/* Shortcuts */}
        <button
          id="toolbar-shortcuts"
          className="toolbar-btn"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <KeyIcon />
        </button>
      </div>

      {/* Shortcuts panel */}
      {shortcutsOpen && (
        <div
          className="shortcuts-overlay"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="shortcuts-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shortcuts-header">
              <span>keyboard shortcuts</span>
              <button className="shortcuts-close" onClick={() => setShortcutsOpen(false)}>✕</button>
            </div>
            <div className="shortcuts-grid">
              {SHORTCUTS.map(({ key, action }) => (
                <div key={key} className="shortcut-row">
                  <kbd className="shortcut-key">{key}</kbd>
                  <span className="shortcut-action">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .toolbar {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 2px;
          background: var(--toolbar-bg);
          border: 1px solid var(--toolbar-border);
          border-radius: 10px;
          box-shadow: var(--toolbar-shadow);
          padding: 4px;
          z-index: 200;
        }
        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          border: none;
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 80ms, color 80ms;
        }
        .toolbar-btn:hover {
          background: var(--search-result-hover);
          color: var(--text-primary);
        }
        .toolbar-btn--text {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          width: auto;
          padding: 0 8px;
        }
        .toolbar-btn.active {
          color: var(--accent);
          background: var(--accent-light);
        }
        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: var(--toolbar-border);
          margin: 0 2px;
        }

        /* Shortcuts overlay */
        .shortcuts-overlay {
          position: fixed;
          inset: 0;
          background: var(--overlay-bg);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: overlay-in 100ms ease;
        }
        .shortcuts-panel {
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 10px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
          width: 380px;
          max-width: calc(100vw - 32px);
          overflow: hidden;
          animation: search-panel-in 120ms ease;
        }
        .shortcuts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--search-border);
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-muted);
        }
        .shortcuts-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          padding: 2px 4px;
        }
        .shortcuts-grid {
          padding: 8px;
        }
        .shortcut-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 8px;
          border-radius: 4px;
        }
        .shortcut-row:hover { background: var(--search-result-hover); }
        .shortcut-key {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          background: var(--canvas-bg);
          border: 1px solid var(--search-border);
          border-radius: 4px;
          padding: 2px 7px;
          min-width: 120px;
          text-align: center;
          color: var(--text-secondary);
        }
        .shortcut-action {
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
      `}</style>
    </>
  );
}

const SHORTCUTS = [
  { key: 'Ctrl/⌘ + V', action: 'Paste as new note' },
  { key: 'Ctrl/⌘ + N', action: 'New empty note' },
  { key: 'Ctrl/⌘ + F', action: 'Search notes' },
  { key: 'Ctrl/⌘ + K', action: 'Command palette' },
  { key: 'Double-click canvas', action: 'New note here' },
  { key: 'Double-click note', action: 'Edit note' },
  { key: 'Enter (selected)', action: 'Edit note' },
  { key: 'Escape', action: 'Exit edit / deselect' },
  { key: 'Delete (selected)', action: 'Delete note' },
  { key: 'Right-click note', action: 'Color & options menu' },
  { key: 'Scroll', action: 'Pan canvas' },
  { key: 'Ctrl + Scroll', action: 'Zoom canvas' },
  { key: 'Space + drag', action: 'Pan canvas' },
  { key: 'Middle-drag', action: 'Pan canvas' },
];

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1" x2="8" y2="3" />
      <line x1="8" y1="13" x2="8" y2="15" />
      <line x1="1" y1="8" x2="3" y2="8" />
      <line x1="13" y1="8" x2="15" y2="8" />
      <line x1="2.9" y1="2.9" x2="4.3" y2="4.3" />
      <line x1="11.7" y1="11.7" x2="13.1" y2="13.1" />
      <line x1="2.9" y1="13.1" x2="4.3" y2="11.7" />
      <line x1="11.7" y1="4.3" x2="13.1" y2="2.9" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M14 10.5a7 7 0 0 1-8.5-8.5A7 7 0 1 0 14 10.5z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" />
      <line x1="4.5" y1="8" x2="4.5" y2="8.01" strokeWidth="2" />
      <line x1="8" y1="8" x2="8" y2="8.01" strokeWidth="2" />
      <line x1="11.5" y1="8" x2="11.5" y2="8.01" strokeWidth="2" />
    </svg>
  );
}
