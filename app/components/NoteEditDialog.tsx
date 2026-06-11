'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/lib/store';
import type { Note } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import NoteDialogEditor from './DialogEditor';

interface NoteEditDialogProps {
  note: Note;
}

export default function NoteEditDialog({ note }: NoteEditDialogProps) {
  const { stopEditing } = useStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopEditing();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [stopEditing]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      stopEditing();
    }
  }, [stopEditing]);

  const dialog = (
    <div
      ref={backdropRef}
      className="edit-dialog-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="edit-dialog-panel" role="dialog" aria-modal="true" aria-label="Edit note">
        {/* Header */}
        <div className="edit-dialog-header">
          <div className="edit-dialog-meta">
            <span className="edit-dialog-label">editing</span>
            <span className="edit-dialog-timestamp">{formatRelativeTime(note.updatedAt)}</span>
          </div>
          <button
            className="edit-dialog-close"
            onClick={stopEditing}
            aria-label="Close editor"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>done</span>
          </button>
        </div>

        {/* Editor */}
        <div className="edit-dialog-editor">
          <NoteDialogEditor noteId={note.id} content={note.content} autoFocus />
        </div>
      </div>

      <style>{`
        .edit-dialog-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: var(--dialog-backdrop);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          animation: overlay-in 120ms ease-out;
        }
        .edit-dialog-panel {
          width: min(860px, 100%);
          height: min(680px, calc(100vh - 64px));
          background: var(--dialog-bg);
          border: 1px solid var(--dialog-border);
          border-radius: 10px;
          box-shadow: var(--dialog-shadow);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: dialog-in 140ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .edit-dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px 10px;
          border-bottom: 1px solid var(--dialog-border);
          flex-shrink: 0;
        }
        .edit-dialog-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .edit-dialog-label {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--accent);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .edit-dialog-timestamp {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-placeholder);
          letter-spacing: 0.02em;
        }
        .edit-dialog-close {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-muted);
          background: none;
          border: 1px solid var(--dialog-border);
          border-radius: 5px;
          padding: 4px 10px;
          cursor: pointer;
          transition: color 80ms, border-color 80ms, background 80ms;
          letter-spacing: 0.04em;
        }
        .edit-dialog-close:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
          background: var(--dialog-close-hover);
        }
        .edit-dialog-editor {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        @keyframes dialog-in {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(dialog, document.body);
}
