'use client';

import { create } from 'zustand';
import type { Note, NoteColor, CanvasViewport } from './types';
import {
  getAllNotes,
  createNote as dbCreateNote,
  updateNote as dbUpdateNote,
  deleteNote as dbDeleteNote,
  saveSettings,
} from './db';
import { createNewNote, screenToCanvas } from './utils';

interface UIState {
  selectedNoteId: string | null;
  editingNoteId: string | null;
  searchOpen: boolean;
  commandPaletteOpen: boolean;
  vimMode: boolean;
  theme: 'light' | 'dark' | 'system';
  shortcutsOpen: boolean;
}

interface CanvasState {
  viewport: CanvasViewport;
  isPanning: boolean;
}

interface StoreState extends UIState, CanvasState {
  notes: Note[];
  initialized: boolean;

  // Init
  init: (notes: Note[], settings: { vimMode: boolean; theme: 'light' | 'dark' | 'system'; canvasX: number; canvasY: number; canvasZoom: number }) => void;

  // Notes
  addNote: (content?: string, screenX?: number, screenY?: number) => Promise<Note>;
  updateNoteContent: (id: string, content: string) => void;
  updateNotePosition: (id: string, x: number, y: number) => void;
  deleteNote: (id: string) => Promise<void>;
  updateNoteColor: (id: string, color: NoteColor) => Promise<void>;
  toggleNotePin: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<void>;

  // Selection & editing
  selectNote: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;

  // Canvas
  setViewport: (viewport: CanvasViewport) => void;
  setIsPanning: (panning: boolean) => void;

  // UI
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleVimMode: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;

  // Persistence helpers (called from debounced hooks)
  persistNoteContent: (id: string, content: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  notes: [],
  initialized: false,
  selectedNoteId: null,
  editingNoteId: null,
  searchOpen: false,
  commandPaletteOpen: false,
  shortcutsOpen: false,
  vimMode: false,
  theme: 'system',
  viewport: { x: 0, y: 0, zoom: 1 },
  isPanning: false,

  init: (notes, settings) => {
    set({
      notes,
      initialized: true,
      vimMode: settings.vimMode,
      theme: settings.theme,
      viewport: {
        x: settings.canvasX,
        y: settings.canvasY,
        zoom: settings.canvasZoom,
      },
    });
  },

  addNote: async (content = '', screenX?, screenY?) => {
    const { viewport } = get();
    let canvasX: number;
    let canvasY: number;

    if (screenX !== undefined && screenY !== undefined) {
      const pos = screenToCanvas(screenX, screenY, viewport.x, viewport.y, viewport.zoom);
      canvasX = pos.x - 160; // center note on cursor
      canvasY = pos.y - 60;
    } else {
      // Center of viewport
      canvasX = (window.innerWidth / 2 - viewport.x) / viewport.zoom - 160;
      canvasY = (window.innerHeight / 2 - viewport.y) / viewport.zoom - 60;
    }

    // Offset slightly from last note to prevent stacking
    const offset = (get().notes.length % 5) * 24;
    canvasX += offset;
    canvasY += offset;

    const note = createNewNote(canvasX, canvasY, content);
    await dbCreateNote(note);
    set((state) => ({ notes: [...state.notes, note] }));
    return note;
  },

  updateNoteContent: (id, content) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n
      ),
    }));
  },

  updateNotePosition: (id, x, y) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, x, y } : n
      ),
    }));
    // Position persisted on drag end (not every pixel)
    dbUpdateNote(id, { x, y });
  },

  deleteNote: async (id) => {
    await dbDeleteNote(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
      editingNoteId: state.editingNoteId === id ? null : state.editingNoteId,
    }));
  },

  updateNoteColor: async (id, color) => {
    await dbUpdateNote(id, { color });
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, color } : n)),
    }));
  },

  toggleNotePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const pinned = !note.pinned;
    await dbUpdateNote(id, { pinned });
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, pinned } : n)),
    }));
  },

  duplicateNote: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const duplicate = createNewNote(note.x + 32, note.y + 32, note.content);
    duplicate.color = note.color;
    await dbCreateNote(duplicate);
    set((state) => ({ notes: [...state.notes, duplicate] }));
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  startEditing: (id) => set({ editingNoteId: id, selectedNoteId: id }),

  stopEditing: () => set({ editingNoteId: null }),

  setViewport: (viewport) => {
    set({ viewport });
    saveSettings({ canvasX: viewport.x, canvasY: viewport.y, canvasZoom: viewport.zoom });
  },

  setIsPanning: (isPanning) => set({ isPanning }),

  setSearchOpen: (searchOpen) => set({ searchOpen }),

  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

  toggleVimMode: async () => {
    const vimMode = !get().vimMode;
    set({ vimMode });
    await saveSettings({ vimMode });
  },

  setTheme: async (theme) => {
    set({ theme });
    await saveSettings({ theme });
  },

  persistNoteContent: async (id, content) => {
    await dbUpdateNote(id, { content });
  },
}));
