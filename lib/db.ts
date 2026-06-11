import Dexie, { type EntityTable } from 'dexie';
import type { Note, Settings } from './types';

class SlateDatabase extends Dexie {
  notes!: EntityTable<Note, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('SlateBoard');
    this.version(1).stores({
      notes: 'id, createdAt, updatedAt, pinned',
      settings: 'id',
    });
  }
}

export const db = new SlateDatabase();

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get('settings');
  if (existing) return existing;

  const defaults: Settings = {
    id: 'settings',
    theme: 'system',
    vimMode: false,
    canvasX: 0,
    canvasY: 0,
    canvasZoom: 1,
  };
  await db.settings.put(defaults);
  return defaults;
}

export async function saveSettings(partial: Partial<Omit<Settings, 'id'>>) {
  await db.settings.update('settings', partial);
}

export async function getAllNotes(): Promise<Note[]> {
  return db.notes.orderBy('createdAt').toArray();
}

export async function createNote(note: Note): Promise<void> {
  await db.notes.put(note);
}

export async function updateNote(id: string, changes: Partial<Note>): Promise<void> {
  await db.notes.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}
