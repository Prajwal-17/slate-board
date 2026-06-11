import { nanoid } from 'nanoid';
import type { Note, NoteColor } from './types';

export function generateId(): string {
  return nanoid(10);
}

/**
 * Convert canvas-space coordinates to screen-space.
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewportX: number,
  viewportY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: canvasX * zoom + viewportX,
    y: canvasY * zoom + viewportY,
  };
}

/**
 * Convert screen-space coordinates to canvas-space.
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewportX: number,
  viewportY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: (screenX - viewportX) / zoom,
    y: (screenY - viewportY) / zoom,
  };
}

export function createNewNote(
  canvasX: number,
  canvasY: number,
  content = ''
): Note {
  const now = Date.now();
  return {
    id: generateId(),
    content,
    x: canvasX,
    y: canvasY,
    width: 320,
    color: 'default',
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; label: string }> = {
  default: { bg: 'var(--note-bg)', border: 'var(--note-border)', label: 'Slate' },
  amber:   { bg: 'var(--note-amber-bg)', border: 'var(--note-amber-border)', label: 'Amber' },
  green:   { bg: 'var(--note-green-bg)', border: 'var(--note-green-border)', label: 'Green' },
  rose:    { bg: 'var(--note-rose-bg)', border: 'var(--note-rose-border)', label: 'Rose' },
  violet:  { bg: 'var(--note-violet-bg)', border: 'var(--note-violet-border)', label: 'Violet' },
  sky:     { bg: 'var(--note-sky-bg)', border: 'var(--note-sky-border)', label: 'Sky' },
};

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function getContentPreview(content: string, length = 80): string {
  const stripped = content.replace(/[#*`>\-_~\[\]()]/g, '').trim();
  return stripped.length > length ? stripped.slice(0, length) + '…' : stripped;
}
