# Slate Board — Checkup Report

**Date:** 2026-06-11  
**Overall Score:** 30/60 — Watch

## TL;DR

Slate Board is a thoughtfully built infinite-canvas scratchpad with strong intentionality and solid performance fundamentals. The monospace-first aesthetic, custom design tokens, and dual-theme system are deliberate and cohesive. The primary flow — paste, move, edit — works smoothly. However, the surface ships with three real gaps: no undo for destructive actions (delete is permanent), touch targets that fail WCAG minimums, and placeholder/muted text that falls below contrast thresholds in both themes. These are fixable without architectural changes.

---

## Heuristic Scores

| #   | Vital Sign     | Score | Status  | Key Finding                                                                               |
| --- | -------------- | ----- | ------- | ----------------------------------------------------------------------------------------- |
| 1   | Intentionality | 10/10 | Healthy | Custom token system, deliberate monospace aesthetic, dual-theme, non-default palette      |
| 2   | Readability    | 5/10  | Watch   | Placeholder text fails WCAG AA contrast in both themes; muted text marginal in light mode |
| 3   | Usability      | 5/10  | Watch   | Core flow works well; no undo for delete/move — destructive actions are permanent         |
| 4   | Responsiveness | 5/10  | Watch   | Overlays/dialogs adapt; fixed 320px notes don't; no safe-area handling                    |
| 5   | Speed          | 10/10 | Healthy | Client-side only, IndexedDB, debounced persistence, GPU-friendly animations               |
| 6   | Accessibility  | 5/10  | Watch   | Good ARIA foundation; touch targets too small; no focus trap; no live regions             |

---

## What's Working

**Design tokens & theming.** The CSS custom property system is well-organized with light/dark variants for every surface. The dark theme's deep graphite canvas (#141720) with cool-white text (#e2eaf8) is a strong, non-default choice. Theme persistence through IndexedDB and system-preference listening are both implemented.

**Primary interaction loop.** Paste → note appears, drag to reposition, double-click to edit. The flow is nearly frictionless. The staggered-note-offset pattern prevents stacking. Content auto-saves. This is the product's promise delivered cleanly.

**Performance consciousness.** GPU-friendly animations (transform/opacity only), debounced persistence, lazy-loaded vim extension, CSS background-image grid instead of DOM nodes. No unnecessary work on the critical path.

**Keyboard depth.** 14 shortcuts, all documented. Arrow-key navigation in search and command palette. Delete/Enter/Escape on selected notes. The `:focus-visible` ring is present and styled. ARIA roles and labels are applied consistently across overlays, notes, and toolbar.

---

## Priority Issues

### P0 — No undo for destructive actions

Delete is permanent. There's no undo buffer, no trash state, no confirmation dialog. A single Backspace keypress on a selected note removes it from state and IndexedDB instantly. The design principle says "Undo beats confirm" — especially for delete, move, and edit. This is the highest-risk gap in the product.

**Fix:** Add an undo stack to the Zustand store (snapshot before destructive ops) or a 5-second toast with "Undo" button after delete. `/design interaction` or direct store refactor.

### P1 — Touch targets below minimum

Toolbar buttons are 34×34px. WCAG 2.1 SC 2.5.8 Target Size requires 24×24px minimum, but the recommended 44×44px (from WCAG 2.2 draft and mobile best practices) is far more usable on touch devices. Color swatches in the context menu are 20×20px — nearly impossible to tap accurately.

**Fix:** Expand toolbar button hit areas to 44×44px using padded containers or `::before` pseudo-elements. Increase swatch size to at least 28px with adequate spacing. `/design interaction` or direct CSS changes.

### P1 — Placeholder & muted text contrast failures

Light mode: `--text-placeholder` (#94a3b8) on `--note-bg` (#ffffff) ≈ 3.0:1. Muted text (#64748b) on white ≈ 4.5:1 (barely passing AA for normal text, failing for small text). Dark mode: placeholder (#40526a) on canvas (#141720) ≈ 3.2:1.

**Fix:** Darken light-mode placeholder to at least #6b7280. Darken light-mode muted to #4b5563. Lighten dark-mode placeholder to at least #5a7090. `/design recolor` or direct token edits in globals.css.

### P2 — No focus trap in modals

Search overlay, command palette, and edit dialog are modal (`aria-modal="true"`) but don't trap focus. A keyboard user tabbing past the last focusable element leaves the modal and lands on hidden canvas elements.

**Fix:** Add a focus-trap hook or component wrapper. Redirect Tab from last element back to first, Shift+Tab from first to last. Standard pattern, ~30 lines.

### P2 — Notes don't adapt to narrow viewports

At 320px width on a 320px iPhone SE viewport, a note fills the entire screen. The canvas is pannable, so users can move around, but the note itself doesn't scale or wrap differently. No `max-width: 100vw` constraint on note positioning.

**Fix:** Clamp note width to `min(320px, calc(100vw - 32px))` or use container queries. `/design responsive` for a full pass.

### P2 — No live regions for screen reader feedback

When a note is created, deleted, duplicated, or pinned, there's no `aria-live` announcement. Screen reader users get no confirmation that their action succeeded.

**Fix:** Add an `aria-live="polite"` region to the canvas (visually hidden) and push status messages on state changes.

---

## Next Modes

- `/design interaction` — address undo, touch targets, focus trap, live regions
- `/design recolor` — fix placeholder/muted contrast in both themes
- `/design responsive` — make notes adapt, add safe-area handling
