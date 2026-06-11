'use client';

import {
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';
import { useStore } from '@/lib/store';
import { clamp } from '@/lib/utils';
import Note from './Note';
import SearchOverlay from './SearchOverlay';
import Toolbar from './Toolbar';
import CommandPalette from './CommandPalette';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_SPEED = 0.001;

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    notes,
    viewport,
    setViewport,
    isPanning,
    setIsPanning,
    addNote,
    selectNote,
    selectedNoteId,
    editingNoteId,
    searchOpen,
    commandPaletteOpen,
    stopEditing,
    setSearchOpen,
    setCommandPaletteOpen,
  } = useStore();

  const panStart = useRef<{ mouseX: number; mouseY: number; vpX: number; vpY: number } | null>(null);
  const isSpaceHeld = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [isNewNote, setIsNewNote] = useState<string | null>(null);

  // ── Paste → new note ──────────────────────────────────────────────
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept paste when editing a note
      if (editingNoteId) return;
      const text = e.clipboardData?.getData('text/plain');
      if (!text?.trim()) return;

      const note = await addNote(text, lastMousePos.current.x, lastMousePos.current.y);
      setIsNewNote(note.id);
      setTimeout(() => setIsNewNote(null), 400);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editingNoteId, addNote]);

  // ── Track mouse for paste positioning ────────────────────────────
  useEffect(() => {
    const track = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('mousemove', track);
    return () => document.removeEventListener('mousemove', track);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (meta && e.key === 'n') {
        e.preventDefault();
        addNote('');
        return;
      }
      if (meta && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (e.key === 'Escape') {
        if (editingNoteId) {
          stopEditing();
          return;
        }
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        selectNote(null);
        return;
      }
      if (e.key === ' ' && !editingNoteId) {
        isSpaceHeld.current = true;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        isSpaceHeld.current = false;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = '';
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingNoteId, searchOpen, commandPaletteOpen, addNote, selectNote, stopEditing, setSearchOpen, setCommandPaletteOpen]);

  // ── Pan: space+drag or middle-mouse ──────────────────────────────
  const startPan = useCallback((mouseX: number, mouseY: number) => {
    panStart.current = { mouseX, mouseY, vpX: viewport.x, vpY: viewport.y };
    setIsPanning(true);
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, [viewport.x, viewport.y, setIsPanning]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or space+left
    if (e.button === 1 || (e.button === 0 && isSpaceHeld.current)) {
      e.preventDefault();
      startPan(e.clientX, e.clientY);
      return;
    }
    // Left click on canvas background → deselect
    if (e.button === 0 && e.target === e.currentTarget) {
      selectNote(null);
      if (editingNoteId) stopEditing();
    }
  }, [startPan, selectNote, editingNoteId, stopEditing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panStart.current) return;
    const dx = e.clientX - panStart.current.mouseX;
    const dy = e.clientY - panStart.current.mouseY;
    setViewport({
      ...viewport,
      x: panStart.current.vpX + dx,
      y: panStart.current.vpY + dy,
    });
  }, [viewport, setViewport]);

  const handleMouseUp = useCallback(() => {
    panStart.current = null;
    setIsPanning(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = isSpaceHeld.current ? 'grab' : '';
    }
  }, [setIsPanning]);

  // ── Zoom: ctrl+wheel ─────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom around cursor
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomDelta = -e.deltaY * ZOOM_SPEED;
      const newZoom = clamp(viewport.zoom * (1 + zoomDelta), MIN_ZOOM, MAX_ZOOM);
      const scale = newZoom / viewport.zoom;

      setViewport({
        x: mouseX - (mouseX - viewport.x) * scale,
        y: mouseY - (mouseY - viewport.y) * scale,
        zoom: newZoom,
      });
    } else {
      // Pan
      setViewport({
        ...viewport,
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY,
      });
    }
  }, [viewport, setViewport]);

  // ── Double-click → new note ───────────────────────────────────────
  const handleDoubleClick = useCallback(async (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const note = await addNote('', e.clientX, e.clientY);
    setIsNewNote(note.id);
    setTimeout(() => setIsNewNote(null), 400);
  }, [addNote]);

  // Prevent browser pinch-zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener('wheel', prevent, { passive: false });
    return () => el.removeEventListener('wheel', prevent);
  }, []);

  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

  return (
    <>
      {/* Canvas surface */}
      <div
        ref={canvasRef}
        id="canvas-surface"
        className="canvas-surface"
        style={{ cursor: isPanning ? 'grabbing' : '' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Dot grid background */}
        <div
          className="canvas-grid"
          style={{
            backgroundPosition: `${viewport.x % (20 * viewport.zoom)}px ${viewport.y % (20 * viewport.zoom)}px`,
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          }}
        />

        {/* Notes layer */}
        <div
          className="canvas-notes"
          style={{ transform, transformOrigin: '0 0' }}
        >
          {notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              isNew={isNewNote === note.id}
              isSelected={selectedNoteId === note.id}
              isEditing={editingNoteId === note.id}
              viewport={viewport}
            />
          ))}
        </div>

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="canvas-empty">
            <p className="canvas-empty-headline">paste anything</p>
            <p className="canvas-empty-sub">
              Ctrl+V to drop a note · double-click to create · Ctrl+F to search
            </p>
          </div>
        )}
      </div>

      {/* Overlays */}
      {searchOpen && <SearchOverlay />}
      {commandPaletteOpen && <CommandPalette />}
      <Toolbar />

      <style>{`
        .canvas-surface {
          position: fixed;
          inset: 0;
          overflow: hidden;
          user-select: none;
        }
        .canvas-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px);
        }
        .canvas-notes {
          position: absolute;
          top: 0;
          left: 0;
          will-change: transform;
        }
        .canvas-empty {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          gap: 8px;
        }
        .canvas-empty-headline {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 300;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .canvas-empty-sub {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--text-placeholder);
          letter-spacing: 0.02em;
        }
      `}</style>
    </>
  );
}
