"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface NotePreviewProps {
  content: string;
}

export default function NotePreview({ content }: NotePreviewProps) {
  return (
    <div className="font-mono text-[13.5px] leading-[1.6] text-text-primary break-words [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mb-2 [&_h1]:text-text-primary [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:my-2 [&_h2]:text-text-primary [&_h3]:text-[13px] [&_h3]:font-medium [&_h3]:my-1.5 [&_h3]:text-text-secondary [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:pl-4 [&_ul]:mb-1.5 [&_ol]:pl-4 [&_ol]:mb-1.5 [&_li]:my-0.5 [&_li_input[type=checkbox]]:mr-1.5 [&_li_input[type=checkbox]]:accent-brand [&_strong]:font-semibold [&_em]:italic [&_del]:opacity-50 [&_a]:text-brand [&_a]:no-underline hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:my-1.5 [&_blockquote]:py-0.5 [&_blockquote]:pl-2.5 [&_blockquote]:text-text-muted [&_blockquote]:italic [&_hr]:border-none [&_hr]:border-t [&_hr]:border-note-border [&_hr]:my-2 [&_table]:border-collapse [&_table]:text-xs [&_table]:w-full [&_table]:my-1.5 [&_th]:border [&_th]:border-note-border [&_th]:p-1 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-brand-light [&_td]:border [&_td]:border-note-border [&_td]:p-1 [&_td]:text-left [&_pre]:bg-canvas-bg [&_pre]:border [&_pre]:border-note-border [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto [&_pre]:my-1.5 [&_pre]:text-xs [&_.hljs-keyword]:text-brand [&_.hljs-built_in]:text-brand [&_.hljs-string]:text-brand-warm [&_.hljs-comment]:text-text-muted [&_.hljs-comment]:italic [&_.hljs-number]:text-[#7ec8a0]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-canvas-bg border border-note-border rounded px-1 py-px text-[0.9em]"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
