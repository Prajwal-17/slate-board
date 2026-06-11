'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import type { Note as NoteType, CanvasViewport } from '@/lib/types';
import { NOTE_COLORS, formatRelativeTime } from '@/lib/utils';
import NotePreview from './NotePreview';
import NoteEditDialog from './NoteEditDialog';

interface NoteProps {
  note: NoteType;
  isNew: boolean;
  isSelected: boolean;
  isEditing: boolean;
  viewport: CanvasViewport;
}

export default function Note({ note, isNew, isSelected, isEditing, viewport }: NoteProps) {
  const {
    selectNote,
    startEditing,
    stopEditing,
    deleteNote,
    updateNotePosition,
    updateNoteColor,
    toggleNotePin,
    duplicateNote,
  } = useStore();

  const noteRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{
    mouseX: number;
    mouseY: number;
    noteX: number;
    noteY: number;
  } | null>(null);
  const hasDragged = useRef(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const colors = NOTE_COLORS[note.color];

  // ── Drag ────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;

    e.stopPropagation();
    selectNote(note.id);

    const el = noteRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      noteX: note.x,
      noteY: note.y,
    };
    hasDragged.current = false;
  }, [note.id, note.x, note.y, selectNote]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = (e.clientX - dragStart.current.mouseX) / viewport.zoom;
    const dy = (e.clientY - dragStart.current.mouseY) / viewport.zoom;

    if (!hasDragged.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      hasDragged.current = true;
    }

    if (hasDragged.current) {
      updateNotePosition(note.id, dragStart.current.noteX + dx, dragStart.current.noteY + dy);
    }
  }, [note.id, viewport.zoom, updateNotePosition]);

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // ── Click / double-click ─────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDragged.current) return;
    selectNote(note.id);
  }, [note.id, selectNote]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDragged.current) return;
    startEditing(note.id);
  }, [note.id, startEditing]);

  // ── Keyboard when selected ──────────────────────────────────────
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteNote(note.id);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(note.id);
      }
      if (e.key === 'Escape') {
        selectNote(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, note.id, deleteNote, startEditing, selectNote]);

  // ── Context menu ────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const noteStyle: React.CSSProperties = {
    position: 'absolute',
    left: note.x,
    top: note.y,
    width: note.width,
    background: colors.bg,
    borderColor: isEditing ? 'var(--accent)' : colors.border,
    boxShadow: isEditing
      ? 'var(--note-shadow-editing)'
      : isSelected
      ? 'var(--note-shadow-selected)'
      : 'var(--note-shadow)',
    animation: isNew ? 'note-spawn 120ms ease-out' : 'none',
    zIndex: isEditing ? 100 : isSelected ? 50 : note.pinned ? 10 : 1,
    cursor: hasDragged.current ? 'grabbing' : 'grab',
  };

  return (
    <>
      <div
        ref={noteRef}
        className={`note${isEditing ? ' note--editing' : ''}`}
        style={noteStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        tabIndex={0}
        role="article"
        aria-label={`Note: ${note.content.slice(0, 40) || 'empty'}`}
      >
        {/* Pin indicator */}
        {note.pinned && (
          <div className="note-pin" title="Pinned">
            <PinIcon />
          </div>
        )}

        {/* Content area — always preview on the card */}
        <div className="note-content-area">
          <div className="note-preview-area">
            {note.content ? (
              <NotePreview content={note.content} />
            ) : (
              <span className="note-placeholder">empty note — double-click to edit</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="note-footer">
          <span className="note-timestamp">{formatRelativeTime(note.updatedAt)}</span>
          {isEditing && (
            <button
              className="note-done-btn"
              onClick={(e) => { e.stopPropagation(); stopEditing(); }}
            >
              ✕ close
            </button>
          )}
        </div>
      </div>

      {/* Edit dialog — mounts as portal when editing */}
      {isEditing && <NoteEditDialog note={note} />}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="context-menu-section context-menu-colors">
            {(Object.keys(NOTE_COLORS) as Array<keyof typeof NOTE_COLORS>).map((color) => (
              <button
                key={color}
                className={`color-swatch ${note.color === color ? 'active' : ''}`}
                style={{
                  background: NOTE_COLORS[color].bg,
                  borderColor: NOTE_COLORS[color].border,
                }}
                title={NOTE_COLORS[color].label}
                onClick={() => { updateNoteColor(note.id, color); setContextMenu(null); }}
              />
            ))}
          </div>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={() => { startEditing(note.id); setContextMenu(null); }}>
            Edit
          </button>
          <button className="context-menu-item" onClick={() => { duplicateNote(note.id); setContextMenu(null); }}>
            Duplicate
          </button>
          <button className="context-menu-item" onClick={() => { toggleNotePin(note.id); setContextMenu(null); }}>
            {note.pinned ? 'Unpin' : 'Pin'}
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item context-menu-item--danger"
            onClick={() => { deleteNote(note.id); setContextMenu(null); }}
          >
            Delete
          </button>
        </div>
      )}

      <style>{`
        .note {
          border: 1px solid var(--note-border);
          border-radius: var(--radius-note);
          min-height: 80px;
          display: flex;
          flex-direction: column;
          transition: box-shadow 80ms ease, border-color 80ms ease;
          will-change: transform;
          touch-action: none;
        }
        .note:hover {
          box-shadow: var(--note-shadow-hover);
        }
        .note--editing {
          opacity: 0.85;
        }
        .note-pin {
          position: absolute;
          top: -6px;
          right: 10px;
          color: var(--accent);
          line-height: 1;
        }
        .note-content-area {
          flex: 1;
          padding: 12px 14px 8px;
          min-height: 60px;
        }
        .note-preview-area {
          font-family: var(--font-mono);
          font-size: var(--font-size-note);
          line-height: var(--line-height-note);
          color: var(--text-primary);
          word-break: break-word;
          overflow: hidden;
          max-height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        .note-placeholder {
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-placeholder);
          font-style: italic;
        }
        .note-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 14px 8px;
          gap: 8px;
        }
        .note-timestamp {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-placeholder);
          letter-spacing: 0.02em;
        }
        .note-done-btn {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          opacity: 0.8;
        }
        .note-done-btn:hover { opacity: 1; }

        /* Context menu */
        .context-menu {
          position: fixed;
          background: var(--toolbar-bg);
          border: 1px solid var(--toolbar-border);
          border-radius: var(--radius-ui);
          box-shadow: var(--toolbar-shadow);
          padding: 4px;
          min-width: 140px;
          z-index: 1000;
        }
        .context-menu-section { padding: 4px; }
        .context-menu-colors {
          display: flex;
          gap: 6px;
          padding: 6px 8px;
        }
        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid;
          cursor: pointer;
          transition: transform 80ms;
        }
        .color-swatch:hover { transform: scale(1.2); }
        .color-swatch.active { transform: scale(1.2); outline: 2px solid var(--accent); outline-offset: 2px; }
        .context-menu-divider {
          height: 1px;
          background: var(--toolbar-border);
          margin: 4px 0;
        }
        .context-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          background: none;
          border: none;
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
        }
        .context-menu-item:hover { background: var(--search-result-hover); }
        .context-menu-item--danger { color: var(--accent-warm); }
      `}</style>
    </>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.828 1.5a.5.5 0 0 0-.707 0l-4 4a.5.5 0 0 0 0 .707l1.414 1.414-2.829 2.828a.5.5 0 0 0 .707.707l2.829-2.828 1.414 1.414a.5.5 0 0 0 .707 0l4-4a.5.5 0 0 0 0-.707L9.828 1.5zM7 8.5l-1-1 3.5-3.5 1 1L7 8.5zM4 13.5a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-1 0v3z"/>
    </svg>
  );
}
