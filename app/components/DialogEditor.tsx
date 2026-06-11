"use client";

import { useEffect, useRef } from "react";
import { EditorState, Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { searchKeymap } from "@codemirror/search";
import { indentOnInput } from "@codemirror/language";
import { useStore } from "@/lib/store";
import { useTheme } from "./providers/ThemeProvider";

interface DialogEditorProps {
  noteId: string;
  content: string;
  autoFocus?: boolean;
}

const makeTheme = (dark: boolean) =>
  EditorView.theme(
    {
      "&": {
        height: "100%",
        background: "transparent",
        color: dark ? "#e2eaf8" : "#1a2332",
        fontFamily:
          "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "14px",
        lineHeight: "1.65",
      },
      ".cm-scroller": {
        overflow: "auto",
        height: "100%",
        padding: "0",
      },
      ".cm-content": {
        caretColor: dark ? "#7aa0f0" : "#4f7ac7",
        padding: "4px 24px 16px 8px",
        minHeight: "100%",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        tabSize: "4",
      },
      ".cm-cursor": {
        borderLeftColor: dark ? "#7aa0f0" : "#4f7ac7",
        borderLeftWidth: "2px",
      },
      ".cm-selectionBackground, ::selection": {
        background: dark
          ? "rgba(109,158,235,0.25) !important"
          : "#e8f0fb !important",
      },
      ".cm-focused .cm-selectionBackground": {
        background: dark
          ? "rgba(109,158,235,0.25) !important"
          : "#e8f0fb !important",
      },
      ".cm-line": { padding: "0 0 0 4px" },
      ".cm-activeLine": {
        background: dark ? "rgba(109,158,235,0.05)" : "rgba(79,122,199,0.04)",
      },
      ".cm-gutters": {
        background: dark ? "#141820" : "#f7f8fa",
        border: "none",
        borderRight: dark ? "1px solid #252e44" : "1px solid #d4d8df",
        color: dark ? "#40526a" : "#94a3b8",
        minWidth: "48px",
        userSelect: "none",
      },
      ".cm-gutterElement": {
        padding: "0 12px 0 8px",
        textAlign: "right",
        lineHeight: "1.65",
      },
      ".cm-activeLineGutter": {
        background: dark ? "rgba(109,158,235,0.08)" : "rgba(79,122,199,0.06)",
        color: dark ? "#7aa0f0" : "#4f7ac7",
      },
      ".cm-panels": {
        backgroundColor: dark ? "#141820" : "#f7f8fa",
        color: dark ? "#e2eaf8" : "#1a2332",
        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, monospace",
        fontSize: "12px",
      },
      ".cm-panels-top": {
        borderBottom: dark ? "1px solid #252e44" : "1px solid #d4d8df",
      },
      ".cm-panels-bottom": {
        borderTop: dark ? "1px solid #252e44" : "1px solid #d4d8df",
      },
      ".cm-search": {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "6px",
        padding: "6px 12px",
      },
      ".cm-search input": {
        backgroundColor: dark ? "#1e2638" : "#ffffff",
        border: dark ? "1px solid #334155" : "1px solid #cbd5e1",
        color: "inherit",
        padding: "4px 8px",
        borderRadius: "4px",
        outline: "none",
        fontFamily: "inherit",
        fontSize: "12px",
      },
      ".cm-search button": {
        backgroundColor: dark ? "#252e44" : "#e2e8f0",
        border: dark ? "1px solid #334155" : "1px solid #cbd5e1",
        color: "inherit",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "12px",
      },
      ".cm-search button:hover": {
        backgroundColor: dark ? "#334155" : "#cbd5e1",
      },
      ".cm-search label": {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
        userSelect: "none",
      },
      ".cm-vim-panel": {
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
      },
      ".cm-vim-panel input": {
        backgroundColor: "transparent",
        color: "inherit",
        border: "none",
        outline: "none",
        width: "100%",
        fontFamily: "inherit",
        fontSize: "13px",
      },
      "&.cm-focused": { outline: "none" },
    },
    { dark },
  );

function getVimMode(view: EditorView): string | null {
  try {
    const vimState = (view as unknown as Record<string, unknown>).cm;
    if (vimState && typeof vimState === "object") {
      const state = vimState as Record<string, unknown>;
      if (state.state && typeof state.state === "object") {
        const vim = (state.state as Record<string, unknown>).vim;
        if (vim && typeof vim === "object") {
          const mode = (vim as Record<string, unknown>).mode;
          return typeof mode === "string" ? mode : null;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export default function NoteDialogEditor({
  noteId,
  content,
  autoFocus = false,
}: DialogEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const destroyedRef = useRef(false);

  const { updateNoteContent, persistNoteContent, vimMode } = useStore();
  const { resolvedTheme } = useTheme();

  const contentRef = useRef(content);
  const persistRef = useRef(persistNoteContent);
  persistRef.current = persistNoteContent;

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy any existing view first (guard against StrictMode double-mount)
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }
    destroyedRef.current = false;

    const dark = resolvedTheme === "dark";

    const buildExtensions = async (): Promise<Extension[]> => {
      const baseExtensions: Extension[] = [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        indentOnInput(),
        makeTheme(dark),
        markdown({ base: markdownLanguage }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            contentRef.current = newContent;
            updateNoteContent(noteId, newContent);
            const timeout = setTimeout(() => {
              persistRef.current(noteId, newContent);
            }, 300);
            return () => clearTimeout(timeout);
          }
        }),
      ];

      if (vimMode) {
        try {
          const { vim } = await import("@replit/codemirror-vim");
          baseExtensions.push(vim());
        } catch {
          // vim extension failed to load — continue without it
        }
      }

      return baseExtensions;
    };

    let view: EditorView;

    buildExtensions().then((extensions) => {
      // If already destroyed before async resolved, abort
      if (destroyedRef.current || !containerRef.current) return;

      const state = EditorState.create({
        doc: contentRef.current,
        extensions,
      });

      view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;

      if (autoFocus) {
        view.focus();
        view.dispatch({
          selection: { anchor: view.state.doc.length },
        });
      }
    });

    return () => {
      destroyedRef.current = true;
      if (contentRef.current) {
        persistRef.current(noteId, contentRef.current);
      }
      view?.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, vimMode, resolvedTheme]);

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (contentRef.current) {
        persistRef.current(noteId, contentRef.current);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [noteId]);

  // Vim-aware ESC handling: insert → normal → close editor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      const view = viewRef.current;
      if (!view || !view.hasFocus) return;

      if (vimMode) {
        const before = getVimMode(view);
        // Let vim process the key first (runs at next microtask)
        queueMicrotask(() => {
          const after = getVimMode(view);
          // Mode changed (insert→normal or visual→normal) — don't close
          if (before !== after) return;
          // Already in normal mode — close editor
          window.dispatchEvent(new CustomEvent("close-editor"));
        });
        e.stopPropagation();
      }
      // Non-vim: let the dialog's ESC handler close normally
    };

    container.addEventListener("keydown", handleKeyDown, true);
    return () => container.removeEventListener("keydown", handleKeyDown, true);
  }, [vimMode]);

  // Sync external content changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content && content !== contentRef.current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  return <div ref={containerRef} className="flex-1 h-full overflow-hidden" />;
}
