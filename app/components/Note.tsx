"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Pencil, Copy, Trash2, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Note as NoteType, CanvasViewport } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import NotePreview from "./NotePreview";
import NoteEditDialog from "./NoteEditDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NoteProps {
  note: NoteType;
  isNew: boolean;
  isSelected: boolean;
  isEditing: boolean;
  viewport: CanvasViewport;
}

export default function Note({
  note,
  isNew,
  isSelected,
  isEditing,
  viewport,
}: NoteProps) {
  const {
    selectNote,
    startEditing,
    stopEditing,
    deleteNote,
    updateNotePosition,
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Detect overflow to show "more" indicator
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, [note.content, isEditing]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [note.id, note.x, note.y, selectNote],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      const dx = (e.clientX - dragStart.current.mouseX) / viewport.zoom;
      const dy = (e.clientY - dragStart.current.mouseY) / viewport.zoom;

      if (!hasDragged.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        hasDragged.current = true;
      }

      if (hasDragged.current) {
        updateNotePosition(
          note.id,
          dragStart.current.noteX + dx,
          dragStart.current.noteY + dy,
        );
      }
    },
    [note.id, viewport.zoom, updateNotePosition],
  );

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasDragged.current) return;
      selectNote(note.id);
    },
    [note.id, selectNote],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasDragged.current) return;
      startEditing(note.id);
    },
    [note.id, startEditing],
  );

  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteNote(note.id);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        startEditing(note.id);
      }
      if (e.key === "Escape") {
        selectNote(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, isEditing, note.id, deleteNote, startEditing, selectNote]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          ref={noteRef}
          className={[
            "absolute border rounded-[6px] min-h-[80px] flex flex-col",
            "transition-shadow duration-[80ms] transition-colors",
            "will-change-transform touch-none",
            "hover:shadow-note-hover",
            "bg-note-bg",
            isEditing ? "border-brand opacity-85" : "border-note-border",
            isNew ? "animate-[note-spawn_120ms_ease-out]" : "",
            isEditing
              ? "shadow-note-editing"
              : isSelected
                ? "shadow-note-selected"
                : "shadow-note",
          ].join(" ")}
          style={{
            left: note.x,
            top: note.y,
            width: note.width,
            zIndex: isEditing ? 100 : isSelected ? 50 : 1,
            cursor: hasDragged.current ? "grabbing" : "grab",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          tabIndex={0}
          role="article"
          aria-label={`Note: ${note.content.slice(0, 40) || "empty"}`}
        >
          <div className="flex-1 px-3.5 pt-3 pb-2 min-h-[60px]">
            {isEditing ? (
              <div
                ref={contentRef}
                className="font-mono text-[13.5px] leading-[1.6] text-text-muted break-words overflow-hidden max-h-[400px] whitespace-pre-wrap opacity-60"
                style={
                  isOverflowing
                    ? {
                        maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                      }
                    : undefined
                }
              >
                {note.content || (
                  <span className="font-mono text-xs text-text-placeholder italic">
                    empty note — double-click to edit
                  </span>
                )}
              </div>
            ) : (
              <div
                ref={contentRef}
                className="font-mono text-[13.5px] leading-[1.6] text-text-primary break-words overflow-hidden max-h-[400px] whitespace-pre-wrap"
                style={
                  isOverflowing
                    ? {
                        maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                      }
                    : undefined
                }
              >
                {note.content ? (
                  <NotePreview content={note.content} />
                ) : (
                  <span className="font-mono text-xs text-text-placeholder italic">
                    empty note — double-click to edit
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-3.5 pb-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-text-placeholder tracking-[0.02em]">
                {formatRelativeTime(note.updatedAt)}
              </span>
              {isOverflowing && (
                <div className="flex items-center gap-0.5 text-[10px] text-brand/80 font-mono font-medium tracking-[0.05em] uppercase px-1.5 py-0.5 bg-brand/10 rounded-sm">
                  <span>more</span>
                  <ChevronDown size={12} strokeWidth={2.5} />
                </div>
              )}
            </div>
            {isEditing && (
              <button
                className="font-mono text-[11px] text-brand bg-none border-none cursor-pointer px-1 py-0.5 rounded hover:opacity-100 opacity-80"
                onClick={(e) => {
                  e.stopPropagation();
                  stopEditing();
                }}
              >
                ✕ close
              </button>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => startEditing(note.id)}>
            <Pencil size={14} className="mr-2" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem onClick={() => duplicateNote(note.id)}>
            <Copy size={14} className="mr-2" />
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => deleteNote(note.id)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isEditing && <NoteEditDialog note={note} />}
    </>
  );
}
