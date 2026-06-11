'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { getContentPreview } from '@/lib/utils';

export default function SearchOverlay() {
  const { notes, setSearchOpen, setViewport, viewport, selectNote } = useStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter notes
  const results = query.trim()
    ? notes.filter((n) =>
        n.content.toLowerCase().includes(query.toLowerCase())
      )
    : notes.slice(0, 8); // show recent when no query

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

      // Pan canvas so note is centered in viewport
      const vpX = window.innerWidth / 2 - note.x * viewport.zoom - (note.width * viewport.zoom) / 2;
      const vpY = window.innerHeight / 2 - note.y * viewport.zoom - 60 * viewport.zoom;

      setViewport({ ...viewport, x: vpX, y: vpY });
      selectNote(noteId);
      setSearchOpen(false);
    },
    [notes, viewport, setViewport, selectNote, setSearchOpen]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      navigateToNote(results[activeIndex].id);
    }
    if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  // Scroll active result into view
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const active = container.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div
      className="search-overlay"
      onClick={() => setSearchOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search notes"
    >
      <div
        className="search-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-input-row">
          <SearchIcon />
          <input
            ref={inputRef}
            id="search-input"
            className="search-input"
            type="text"
            placeholder="search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search-esc-hint" onClick={() => setSearchOpen(false)}>esc</kbd>
        </div>

        {results.length > 0 && (
          <div ref={resultsRef} className="search-results" role="listbox">
            {results.map((note, i) => {
              const preview = getContentPreview(note.content);
              const isActive = i === activeIndex;
              return (
                <div
                  key={note.id}
                  data-index={i}
                  className={`search-result ${isActive ? 'active' : ''}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => navigateToNote(note.id)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="search-result-text">
                    {highlightMatch(preview || '(empty note)', query)}
                  </span>
                  <span className="search-result-meta">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="search-empty">no notes match &ldquo;{query}&rdquo;</div>
        )}

        <div className="search-footer">
          <span>↑↓ navigate</span>
          <span>↵ go to note</span>
          <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <style>{`
        .search-overlay {
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
        .search-panel {
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 10px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
          width: 560px;
          max-width: calc(100vw - 32px);
          overflow: hidden;
          animation: search-panel-in 120ms ease;
        }
        .search-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--search-border);
        }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--font-mono);
          font-size: 15px;
          color: var(--text-primary);
          caret-color: var(--accent);
        }
        .search-input::placeholder { color: var(--text-placeholder); }
        .search-esc-hint {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-placeholder);
          background: var(--canvas-bg);
          border: 1px solid var(--search-border);
          border-radius: 3px;
          padding: 2px 5px;
          cursor: pointer;
        }
        .search-results {
          max-height: 320px;
          overflow-y: auto;
        }
        .search-result {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 60ms;
        }
        .search-result:hover,
        .search-result.active { background: var(--search-result-hover); }
        .search-result-text {
          flex: 1;
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-result-meta {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-placeholder);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .search-highlight {
          background: var(--accent-light);
          color: var(--accent);
          border-radius: 2px;
          padding: 0 1px;
        }
        .search-empty {
          padding: 24px 16px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-muted);
        }
        .search-footer {
          display: flex;
          gap: 16px;
          padding: 8px 16px;
          border-top: 1px solid var(--search-border);
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-placeholder);
        }
        .search-footer span:last-child { margin-left: auto; }
      `}</style>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}
