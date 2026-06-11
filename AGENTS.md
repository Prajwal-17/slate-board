# Slate Board — LLM Context

> **Local-first infinite-canvas scratchpad.** UX principle: "Open. Paste. Done."

Slate Board is a single-page, fully client-side Next.js app. No server, no API routes, no auth. All data lives in the browser (IndexedDB via Dexie.js). Paste text → movable color-coded note on a zoomable/pannable canvas. Markdown editing with CodeMirror + optional Vim mode.

---

## Tech Stack

| Layer       | Technology                                                                             |
| ----------- | -------------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, React 19, all client components)                               |
| Language    | TypeScript 5 (strict, ES2017 target)                                                   |
| State       | Zustand v5 (single global store)                                                       |
| Database    | Dexie.js v4 (IndexedDB wrapper, persistent)                                            |
| Editor      | CodeMirror 6 (markdown lang, history, search keymap) + optional @replit/codemirror-vim |
| Markdown    | react-markdown v10 + remark-gfm + rehype-highlight                                     |
| Styling     | Tailwind CSS v4 + CSS custom properties for theming (no CSS-in-JS)                     |
| IDs         | nanoid v5 (10-char)                                                                    |
| Package mgr | Bun                                                                                    |

---

## Architecture

```
app/          Next.js App Router (all 'use client')
├── layout.tsx       Root layout, metadata, wraps children in ThemeProvider
├── page.tsx         Single page, renders <AppBootstrap />
├── globals.css      Design tokens (:root + [data-theme='dark']), resets, animations
└── components/
    ├── AppBootstrap.tsx    Boot: loads notes+settings from Dexie → init store
    ├── Canvas.tsx          Infinite canvas: dot grid, pan/zoom, paste, shortcuts
    ├── CommandPalette.tsx  ⌘K modal: typed commands (new, search, theme, vim, export)
    ├── DialogEditor.tsx    CodeMirror for modal dialog (line numbers, gutter, full chrome)
    ├── Editor.tsx          CodeMirror for inline note editing (minimal chrome)
    ├── Note.tsx            Note card: drag, click, dbl-click, context menu, color swatches
    ├── NoteEditDialog.tsx  Portal modal wrapping DialogEditor for editing a note
    ├── NotePreview.tsx     Markdown preview (react-markdown) on note card surface
    ├── SearchOverlay.tsx   ⌘F overlay: fuzzy-filter notes, navigate to match
    ├── Toolbar.tsx         Floating toolbar + keyboard shortcuts help panel
    └── providers/
        └── ThemeProvider.tsx  React Context for light/dark/system theme

lib/          Non-UI logic
├── types.ts     All TypeScript types (Note, Settings, CanvasViewport, NoteColor, ThemeMode)
├── db.ts        Dexie schema, CRUD helpers (getSettings, saveSettings, getAllNotes, etc.)
├── store.ts     Zustand store: notes[], UI state, canvas viewport, all actions
└── utils.ts     Pure utilities: generateId, coord transforms, createNewNote, formatRelativeTime

public/       Static assets (favicon)
```

---

## File Map (one-liners)

| File                                         | Purpose                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `app/layout.tsx`                             | Root layout: metadata, `<ThemeProvider>` wrapper                                                |
| `app/page.tsx`                               | Single-page entry, renders `<AppBootstrap />`                                                   |
| `app/globals.css`                            | CSS design tokens (light+dark), resets, scrollbar, animations                                   |
| `app/components/AppBootstrap.tsx`            | On mount, loads DB → init store → render `<Canvas />`                                           |
| `app/components/Canvas.tsx`                  | Infinite canvas: dot grid, pan/zoom, paste handler, shortcut dispatch                           |
| `app/components/CommandPalette.tsx`          | ⌘K command palette (new note, search, theme, vim, reset, export)                                |
| `app/components/DialogEditor.tsx`            | CodeMirror for modal dialog (gutter, line numbers, vim support)                                 |
| `app/components/Editor.tsx`                  | CodeMirror for inline editing on the note card                                                  |
| `app/components/Note.tsx`                    | Note card: drag, select, edit, color, pin, context menu                                         |
| `app/components/NoteEditDialog.tsx`          | Portal modal wrapping DialogEditor                                                              |
| `app/components/NotePreview.tsx`             | Renders markdown via react-markdown                                                             |
| `app/components/SearchOverlay.tsx`           | ⌘F search: filter notes by content, navigate to result                                          |
| `app/components/Toolbar.tsx`                 | Floating toolbar + keyboard shortcuts reference panel                                           |
| `app/components/providers/ThemeProvider.tsx` | Theme context: light/dark/system with system-preference listener                                |
| `lib/types.ts`                               | `Note`, `Settings`, `CanvasViewport`, `NoteColor`, `ThemeMode`                                  |
| `lib/db.ts`                                  | Dexie DB: notes table, settings table, all CRUD helpers                                         |
| `lib/store.ts`                               | Zustand store: all state + all actions                                                          |
| `lib/utils.ts`                               | `generateId`, `canvasToScreen`/`screenToCanvas`, `createNewNote`, `clamp`, `formatRelativeTime` |

---

## Data Flow

```
User action (type, paste, drag)
    ↓
React event handler calls Zustand action
    ↓
Zustand updates store IMMEDIATELY (optimistic)
    ↓
React re-renders affected components
    ↓
CodeMirror onChange → useDebounce (300ms) → store.persistNoteContent()
    ↓
persistNoteContent → db.updateNote() → Dexie → IndexedDB
```

**Initialization:** `AppBootstrap` mounts → `db.getAllNotes()` + `db.getSettings()` → `store.init(notes, settings)` → store.initialized = true → `<Canvas />` renders.

---

## Type Definitions

```typescript
type NoteColor = "default" | "amber" | "green" | "rose" | "violet" | "sky";
type ThemeMode = "light" | "dark" | "system";

interface Note {
  id: string; // nanoid(10)
  content: string; // markdown
  x: number; // canvas-space position
  y: number;
  width: number; // default 320
  color: NoteColor;
  pinned: boolean;
  createdAt: number; // Date.now()
  updatedAt: number;
}

interface Settings {
  id: "settings"; // singleton key
  theme: ThemeMode;
  vimMode: boolean;
  canvasX: number; // saved pan offset
  canvasY: number;
  canvasZoom: number; // saved zoom level
}

interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}
```

---

## Zustand Store Structure

```
Store:
  // Data
  notes: Note[]
  initialized: boolean

  // UI
  selectedNoteId: string | null
  editingNoteId: string | null
  searchOpen: boolean
  commandPaletteOpen: boolean
  shortcutsOpen: boolean
  vimMode: boolean
  theme: ThemeMode

  // Canvas
  viewport: CanvasViewport
  isPanning: boolean

  // Actions
  init(notes, settings)
  addNote(note)
  updateNoteContent(id, content)
  updateNotePosition(id, x, y)
  deleteNote(id)
  updateNoteColor(id, color)
  toggleNotePin(id)
  duplicateNote(id)
  selectNote(id)
  startEditing(id) / stopEditing()
  setViewport(x, y, zoom)
  setIsPanning(bool)
  setSearchOpen(bool) / setCommandPaletteOpen(bool) / setShortcutsOpen(bool)
  toggleVimMode()
  setTheme(theme)
  persistNoteContent(id, content)   // debounced DB write
```

---

## Key Patterns

### Coordinate Transforms

All note positions are in **canvas space**. The canvas `<div>` has `transform: translate(viewportX, viewportY) scale(zoom)`. Use `canvasToScreen()` / `screenToCanvas()` from `lib/utils.ts` to convert. Pointer events on the canvas get screen coords → convert to canvas coords before setting note position.

### Portal for Dialogs

`NoteEditDialog` renders via `createPortal(…, document.body)` to escape the canvas transform div (otherwise the dialog would be panned/zoomed with the canvas).

### Optimistic Updates + Debounced Persistence

Content edits update Zustand immediately (UI stays snappy). The `persistNoteContent` action writes to Dexie after a 300ms debounce from `use-debounce`. The debounce timer resets on each keystroke.

### Dynamic Vim Import

`@replit/codemirror-vim` is imported dynamically (`await import('@replit/codemirror-vim')`) only when `vimMode` is true. This avoids bundling it for users who don't use Vim mode. Failure is caught silently.

### Theming via CSS Custom Properties

All colors are defined as CSS custom properties in `app/globals.css`:

- `:root { … }` — light theme tokens (50+ variables)
- `[data-theme='dark'] { … }` — dark theme overrides
- `ThemeProvider` sets `data-theme` on `<html>`
- Components reference `var(--canvas-bg)`, `var(--note-bg)`, `var(--text-primary)`, etc.
- Note color variants use `var(--note-amber-bg)`, `var(--note-green-border)`, etc.

### Note Colors

Defined in `lib/utils.ts` as `NOTE_COLORS` — maps each `NoteColor` to `{ bg, border, label }`. The bg/border values are CSS variable references (e.g., `'var(--note-amber-bg)'`).

---

## Keyboard Shortcuts (13 total)

| Key                                   | Action                               |
| ------------------------------------- | ------------------------------------ |
| `⌘N`                                  | New note                             |
| `⌘F`                                  | Search overlay                       |
| `⌘K`                                  | Command palette                      |
| `⌘V`                                  | Paste note from clipboard            |
| `Esc`                                 | Exit edit / deselect / close overlay |
| `Space+drag`                          | Pan canvas                           |
| `Middle-mouse drag`                   | Pan canvas                           |
| `Ctrl+Scroll`                         | Zoom canvas                          |
| `Enter` (on selected note)            | Start editing                        |
| `Delete/Backspace` (on selected note) | Delete note                          |
| `Dbl-click canvas`                    | New note at cursor                   |
| `Dbl-click note`                      | Start editing                        |
| Right-click note                      | Context menu                         |

---

## Database (Dexie / IndexedDB)

- **DB name:** `SlateBoard`
- **Table `notes`:** primary key `id` (string). Indexed fields: `createdAt`, `updatedAt`, `pinned`. Stored fields: `content`, `x`, `y`, `width`, `color`.
- **Table `settings`:** singleton row with key `'settings'`. Stored fields: `theme`, `vimMode`, `canvasX`, `canvasY`, `canvasZoom`.
- Schema version: 1. To add a new column: bump schema version in `lib/db.ts`, add migration in `db.version(n).stores({…}).upgrade(…)`.

---

## How to Add a Feature

1. **New data field?** Add to type in `lib/types.ts`
2. **Needs DB column?** Bump schema version in `lib/db.ts`, add to `.stores()`, add `.upgrade()` migration if backfilling
3. **New state?** Add to Zustand store in `lib/store.ts` (state + actions)
4. **Utility function?** Add to `lib/utils.ts`
5. **New UI?** Create component in `app/components/`
6. **New command?** Add to `CommandPalette.tsx` commands array
7. **New shortcut?** Add handler in `Canvas.tsx` keyboard event listener + document in `Toolbar.tsx`
8. **New color variant?** Add to `NoteColor` union in `lib/types.ts`, add entry in `NOTE_COLORS` in `lib/utils.ts`, add CSS custom properties in `app/globals.css`
9. **New CSS token?** Add to both `:root` and `[data-theme='dark']` blocks in `globals.css`

---

## Build & Run

```bash
bun dev       # → next dev (port 3000)
bun run build # → next build
bun start     # → next start
bun lint      # → eslint
```

Deploy to Vercel with zero configuration. No database setup, no env vars — everything runs in the browser.

---

## Important Constraints

- **All components are `'use client'`.** No SSR. No server components with logic.
- **No API routes.** Zero backend. Don't create `app/api/`.
- **No auth.** Single-user local storage. Don't add authentication.
- **No new npm dependencies** without strong justification. The dependency surface is already careful.
- **Tailwind v4** — uses the PostCSS plugin, not the CLI. Config in `postcss.config.mjs`.
- **ESLint 9 flat config** — rules defined in `eslint.config.mjs`, not `.eslintrc`.
- **TypeScript strict mode** — all new code must pass strict checks.
- **Next.js 16** — read `node_modules/next/dist/docs/` for API reference (this version may differ from training data).
