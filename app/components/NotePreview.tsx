'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface NotePreviewProps {
  content: string;
}

export default function NotePreview({ content }: NotePreviewProps) {
  return (
    <div className="note-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Open links in new tab
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          // Inline code
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return <code className={className} {...props}>{children}</code>;
            }
            return <code className="inline-code" {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      <style>{`
        .note-markdown {
          font-family: var(--font-mono);
          font-size: var(--font-size-note);
          line-height: var(--line-height-note);
          color: var(--text-primary);
          word-break: break-word;
        }
        .note-markdown h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--text-primary);
        }
        .note-markdown h2 {
          font-size: 14px;
          font-weight: 600;
          margin: 8px 0 6px;
          color: var(--text-primary);
        }
        .note-markdown h3 {
          font-size: 13px;
          font-weight: 500;
          margin: 6px 0 4px;
          color: var(--text-secondary);
        }
        .note-markdown p { margin: 0 0 6px; }
        .note-markdown p:last-child { margin-bottom: 0; }
        .note-markdown ul, .note-markdown ol {
          padding-left: 16px;
          margin: 0 0 6px;
        }
        .note-markdown li { margin: 2px 0; }
        .note-markdown li input[type="checkbox"] {
          margin-right: 6px;
          accent-color: var(--accent);
        }
        .note-markdown strong { font-weight: 600; }
        .note-markdown em { font-style: italic; }
        .note-markdown del { opacity: 0.5; }
        .note-markdown a {
          color: var(--accent);
          text-decoration: none;
        }
        .note-markdown a:hover { text-decoration: underline; }
        .note-markdown blockquote {
          border-left: 2px solid var(--accent);
          margin: 6px 0;
          padding: 2px 10px;
          color: var(--text-muted);
          font-style: italic;
        }
        .note-markdown hr {
          border: none;
          border-top: 1px solid var(--note-border);
          margin: 8px 0;
        }
        .note-markdown table {
          border-collapse: collapse;
          font-size: var(--font-size-sm);
          width: 100%;
          margin: 6px 0;
        }
        .note-markdown th, .note-markdown td {
          border: 1px solid var(--note-border);
          padding: 4px 8px;
          text-align: left;
        }
        .note-markdown th { font-weight: 600; background: var(--accent-light); }
        .note-markdown pre {
          background: var(--canvas-bg);
          border: 1px solid var(--note-border);
          border-radius: 4px;
          padding: 8px 10px;
          overflow-x: auto;
          margin: 6px 0;
          font-size: var(--font-size-sm);
        }
        .note-markdown .inline-code {
          background: var(--canvas-bg);
          border: 1px solid var(--note-border);
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 0.9em;
        }
        /* Highlight.js minimal overrides for both themes */
        .note-markdown .hljs-keyword,
        .note-markdown .hljs-built_in { color: var(--accent); }
        .note-markdown .hljs-string { color: var(--accent-warm); }
        .note-markdown .hljs-comment { color: var(--text-muted); font-style: italic; }
        .note-markdown .hljs-number { color: #7ec8a0; }
      `}</style>
    </div>
  );
}
