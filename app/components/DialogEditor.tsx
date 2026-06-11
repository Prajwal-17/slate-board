'use client';

import { useEffect, useRef } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { searchKeymap } from '@codemirror/search';
import { indentOnInput } from '@codemirror/language';
import { useStore } from '@/lib/store';
import { useTheme } from './providers/ThemeProvider';

interface DialogEditorProps {
  noteId: string;
  content: string;
  autoFocus?: boolean;
}

const makeTheme = (dark: boolean) =>
  EditorView.theme(
    {
      '&': {
        height: '100%',
        background: 'transparent',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        lineHeight: '1.65',
      },
      '.cm-scroller': {
        overflow: 'auto',
        height: '100%',
        padding: '0',
      },
      '.cm-content': {
        caretColor: 'var(--accent)',
        padding: '16px 24px 16px 8px',
        minHeight: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        tabSize: '4',
      },
      '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
      '.cm-selectionBackground, ::selection': {
        background: dark ? 'rgba(109,158,235,0.25) !important' : 'var(--accent-light) !important',
      },
      '.cm-focused .cm-selectionBackground': {
        background: dark ? 'rgba(109,158,235,0.25) !important' : 'var(--accent-light) !important',
      },
      '.cm-line': { padding: '0 0 0 4px' },
      '.cm-activeLine': {
        background: dark ? 'rgba(109,158,235,0.05)' : 'rgba(79,122,199,0.04)',
      },
      '.cm-gutters': {
        background: 'var(--dialog-gutter-bg)',
        border: 'none',
        borderRight: '1px solid var(--dialog-border)',
        color: 'var(--text-placeholder)',
        minWidth: '48px',
        userSelect: 'none',
      },
      '.cm-gutterElement': {
        padding: '0 12px 0 8px',
        textAlign: 'right',
        lineHeight: '1.65',
      },
      '.cm-activeLineGutter': {
        background: dark ? 'rgba(109,158,235,0.08)' : 'rgba(79,122,199,0.06)',
        color: 'var(--accent)',
      },
      '&.cm-focused': { outline: 'none' },
    },
    { dark }
  );

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

    const dark = resolvedTheme === 'dark';

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
          const { vim } = await import('@replit/codemirror-vim');
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

  return (
    <div
      ref={containerRef}
      className="dialog-cm-container"
      style={{ flex: 1, height: '100%', overflow: 'hidden' }}
    />
  );
}
