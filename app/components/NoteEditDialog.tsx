"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Copy } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import NoteDialogEditor from "./DialogEditor";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NoteEditDialogProps {
  note: Note;
}

export default function NoteEditDialog({ note }: NoteEditDialogProps) {
  const { stopEditing, deleteNote, duplicateNote } = useStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on custom event from DialogEditor (vim normal mode ESC)
  useEffect(() => {
    const handleClose = () => stopEditing();
    window.addEventListener("close-editor", handleClose);
    return () => window.removeEventListener("close-editor", handleClose);
  }, [stopEditing]);

  // Close on ESC (non-vim mode or when editor isn't focused)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopEditing();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [stopEditing]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        stopEditing();
      }
    },
    [stopEditing],
  );

  const handleBackdropDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        stopEditing();
      }
    },
    [stopEditing],
  );

  const handleDelete = useCallback(() => {
    deleteNote(note.id);
    stopEditing();
  }, [deleteNote, note.id, stopEditing]);

  const handleDuplicate = useCallback(() => {
    duplicateNote(note.id);
  }, [duplicateNote, note.id]);

  const dialog = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[500] bg-dialog-backdrop flex items-center justify-center p-6 animate-[overlay-in_120ms_ease-out]"
      onClick={handleBackdropClick}
      onDoubleClick={handleBackdropDoubleClick}
    >
      <div
        className="w-[min(960px,100%)] h-[min(780px,calc(100vh-48px))] bg-dialog-bg border border-dialog-border rounded-[10px] shadow-dialog flex flex-col overflow-hidden animate-[dialog-in_140ms_cubic-bezier(0.16,1,0.3,1)]"
        role="dialog"
        aria-modal="true"
        aria-label="Edit note"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-dialog-border shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-brand tracking-[0.08em] uppercase font-medium">
              editing
            </span>
            <span className="font-mono text-[11px] text-text-placeholder tracking-[0.02em]">
              {formatRelativeTime(note.updatedAt)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                className="flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-dialog-close-hover transition-colors cursor-pointer"
                onClick={handleDuplicate}
                aria-label="Duplicate note"
              >
                <Copy size={14} strokeWidth={1.5} />
              </TooltipTrigger>
              <TooltipContent side="bottom">Duplicate note</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                className="flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-red-500 hover:bg-dialog-close-hover transition-colors cursor-pointer"
                onClick={handleDelete}
                aria-label="Delete note"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete note</TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-dialog-border mx-1" />
            <Tooltip>
              <TooltipTrigger
                className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted bg-transparent border border-dialog-border rounded-md px-2.5 py-1 cursor-pointer tracking-[0.04em] hover:text-text-primary hover:border-text-muted hover:bg-dialog-close-hover transition-colors"
                onClick={stopEditing}
                aria-label="Close editor"
              >
                <X size={14} strokeWidth={1.5} />
                <span>done</span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Close editor (Esc)</TooltipContent>
            </Tooltip>
          </div>
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
