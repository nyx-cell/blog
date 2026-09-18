import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CommentMarkdownProps = {
  content: string;
};

/**
 * Lightweight markdown renderer for comments.
 *
 * Deliberately does NOT reuse the post-body `<Markdown>` component: that one
 * pulls in shiki + katex, which would balloon this client island. Comments
 * only need inline formatting + code/links/lists, so we run
 * react-markdown + remark-gfm with no heavy rehype plugins.
 *
 * XSS posture matches docs/architecture.md §8: no `rehype-raw` (raw HTML is
 * escaped), and react-markdown's default `urlTransform` strips dangerous URL
 * protocols (`javascript:`, `data:`, `vbscript:`) from links.
 */
export function CommentMarkdown({ content }: CommentMarkdownProps) {
  return (
    <div className='text-sm leading-6'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target='_blank'
              rel='noreferrer'
              className='text-primary/80 transition-colors hover:text-primary dark:text-primary/80 dark:hover:text-primary'
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <b className='font-semibold'>{children}</b>,
          em: ({ children }) => <em>{children}</em>,
          ul: ({ children }) => (
            <ul className='mb-2 ml-4 list-disc'>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className='mb-2 ml-4 list-decimal'>{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className='mb-2 border-l-2 border-border pl-3 opacity-70 dark:border-border'>
              {children}
            </blockquote>
          ),
          // Inline code vs fenced block: fenced code carries a `language-*` class
          // and is wrapped in <pre> by react-markdown; only style inline here.
          code: ({ className, children }) => {
            const isBlock = /language-/.test(className ?? '');
            if (isBlock) {
              return <code className={className}>{children}</code>;
            }
            return (
              <code className='rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em] dark:bg-muted'>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className='mb-2 overflow-x-auto rounded-md bg-secondary p-3 text-[0.85em] dark:bg-muted'>
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
