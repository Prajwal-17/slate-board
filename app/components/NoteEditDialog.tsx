"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import NoteDialogEditor from "./DialogEditor";

interface NoteEditDialogProps {
  note: Note;
}

export default function NoteEditDialog({ note }: NoteEditDialogProps) {
  const { stopEditing } = useStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stopEditing();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [stopEditing]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        stopEditing();
      }
    },
    [stopEditing],
  );

  const dialog = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[500] bg-dialog-backdrop flex items-center justify-center p-8 animate-[overlay-in_120ms_ease-out]"
      onClick={handleBackdropClick}
    >
      <div
        className="w-[min(860px,100%)] h-[min(680px,calc(100vh-64px))] bg-dialog-bg border border-dialog-border rounded-[10px] shadow-dialog flex flex-col overflow-hidden animate-[dialog-in_140ms_cubic-bezier(0.16,1,0.3,1)]"
        role="dialog"
        aria-modal="true"
        aria-label="Edit note"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-dialog-border shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-accent tracking-[0.08em] uppercase font-medium">
              editing
            </span>
            <span className="font-mono text-[11px] text-text-placeholder tracking-[0.02em]">
              {formatRelativeTime(note.updatedAt)}
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted bg-transparent border border-dialog-border rounded-md px-2.5 py-1 cursor-pointer tracking-[0.04em] hover:text-text-primary hover:border-text-muted hover:bg-dialog-close-hover transition-colors"
            onClick={stopEditing}
            aria-label="Close editor"
          >
            <X size={14} strokeWidth={1.5} />
            <span>done</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <NoteDialogEditor noteId={note.id} content={note.content} autoFocus />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}
