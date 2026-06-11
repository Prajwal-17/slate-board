"use client";

import { useRef, useCallback, useEffect } from "react";
import { Pin, Pencil, Copy, PinOff, Trash2, Palette } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Note as NoteType, CanvasViewport } from "@/lib/types";
import { NOTE_COLORS, formatRelativeTime } from "@/lib/utils";
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

  const colors = NOTE_COLORS[note.color];

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
            colors.bg,
            isEditing ? "border-brand opacity-85" : colors.border,
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
            zIndex: isEditing ? 100 : isSelected ? 50 : note.pinned ? 10 : 1,
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
            {note.pinned && (
              <div
                className="absolute -top-1.5 right-2.5 text-brand leading-none"
                title="Pinned"
              >
                <Pin size={12} fill="currentColor" />
              </div>
            )}

            <div className="flex-1 px-3.5 pt-3 pb-2 min-h-[60px]">
              {isEditing ? (
                <div className="font-mono text-[13.5px] leading-[1.6] text-text-muted break-words overflow-hidden max-h-[400px] overflow-y-auto whitespace-pre-wrap opacity-60">
                  {note.content || (
                    <span className="font-mono text-xs text-text-placeholder italic">
                      empty note — double-click to edit
                    </span>
                  )}
                </div>
              ) : (
                <div className="font-mono text-[13.5px] leading-[1.6] text-text-primary break-words overflow-hidden max-h-[400px] overflow-y-auto whitespace-pre-wrap">
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
              <span className="font-mono text-[11px] text-text-placeholder tracking-[0.02em]">
                {formatRelativeTime(note.updatedAt)}
              </span>
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
          <ContextMenuItem onClick={() => toggleNotePin(note.id)}>
            {note.pinned ? (
              <PinOff size={14} className="mr-2" />
            ) : (
              <Pin size={14} className="mr-2" />
            )}
            {note.pinned ? "Unpin" : "Pin to top"}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Palette size={14} className="mr-2" />
              Color
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {(Object.keys(NOTE_COLORS) as Array<keyof typeof NOTE_COLORS>).map(
                (color) => (
                  <ContextMenuItem
                    key={color}
                    onClick={() => updateNoteColor(note.id, color)}
                  >
                    <span
                      className="w-4 h-4 rounded-full border-2 mr-2 shrink-0"
                      style={{
                        background:
                          color === "default"
                            ? "var(--note-bg)"
                            : `var(--note-${color}-bg)`,
                        borderColor:
                          color === "default"
                            ? "var(--note-border)"
                            : `var(--note-${color}-border)`,
                      }}
                    />
                    {NOTE_COLORS[color].label}
                  </ContextMenuItem>
                ),
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
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
