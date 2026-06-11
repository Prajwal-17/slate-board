"use client";

import { useEffect, useRef } from "react";
import { EditorState, Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { searchKeymap } from "@codemirror/search";
import { useStore } from "@/lib/store";
import { useTheme } from "./providers/ThemeProvider";

interface EditorProps {
  noteId: string;
  content: string;
  autoFocus?: boolean;
}

const lightTheme = EditorView.theme(
  {
    "&": {
      background: "transparent",
      color: "#1a2332",
      fontFamily:
        "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "13.5px",
      lineHeight: "1.6",
    },
    ".cm-content": { caretColor: "#4f7ac7", padding: "0" },
    ".cm-cursor": { borderLeftColor: "#4f7ac7", borderLeftWidth: "2px" },
    ".cm-selectionBackground, ::selection": {
      background: "#e8f0fb !important",
    },
    ".cm-focused .cm-selectionBackground": { background: "#e8f0fb !important" },
    ".cm-line": { padding: "0" },
    ".cm-activeLine": { background: "rgba(79,122,199,0.06)" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { overflow: "auto", maxHeight: "400px" },
  },
  { dark: false },
);

const darkTheme = EditorView.theme(
  {
    "&": {
      background: "transparent",
      color: "#e2eaf8",
      fontFamily:
        "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "13.5px",
      lineHeight: "1.6",
    },
    ".cm-content": { caretColor: "#7aa0f0", padding: "0" },
    ".cm-cursor": { borderLeftColor: "#7aa0f0", borderLeftWidth: "2px" },
    ".cm-selectionBackground, ::selection": {
      background: "rgba(109,158,235,0.25) !important",
    },
    ".cm-focused .cm-selectionBackground": {
      background: "rgba(109,158,235,0.25) !important",
    },
    ".cm-line": { padding: "0" },
    ".cm-activeLine": { background: "rgba(109,158,235,0.08)" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { overflow: "auto", maxHeight: "400px" },
  },
  { dark: true },
);

export default function NoteEditor({
  noteId,
  content,
  autoFocus = false,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { updateNoteContent, persistNoteContent, vimMode } = useStore();
  const { resolvedTheme } = useTheme();

  const contentRef = useRef(content);
  const persistRef = useRef(persistNoteContent);
  persistRef.current = persistNoteContent;

  useEffect(() => {
    if (!containerRef.current) return;

    const buildExtensions = async (): Promise<Extension[]> => {
      const baseExtensions: Extension[] = [
        history(),
        drawSelection(),
        highlightActiveLine(),
        resolvedTheme === "dark" ? darkTheme : lightTheme,
        markdown({ base: markdownLanguage }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            contentRef.current = newContent;
            updateNoteContent(noteId, newContent);
            // Debounced DB write
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
      const state = EditorState.create({
        doc: content,
        extensions,
      });

      view = new EditorView({
        state,
        parent: containerRef.current!,
      });

      viewRef.current = view;

      if (autoFocus) {
        // Place cursor at end
        view.focus();
        view.dispatch({
          selection: { anchor: view.state.doc.length },
        });
      }
    });

    return () => {
      // Persist before unmounting
      if (contentRef.current) {
        persistRef.current(noteId, contentRef.current);
      }
      view?.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, vimMode, resolvedTheme]);

  // Sync external content changes (e.g. from another source)
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

  return <div ref={containerRef} className="w-full" />;
}
