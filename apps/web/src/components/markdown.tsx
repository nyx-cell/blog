import { Check, Copy } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { HighlighterCore } from 'shiki/core';

type MarkdownProps = {
  content: string;
};

/** Class names for the code block chrome + inline code. */
const CODE_CLASSES = {
  wrap: 'group relative my-4.5 group relative',
  copy: 'absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 [@media(not(hover:hover))]:opacity-75',
  pre: 'shiki th-pre w-full overflow-x-auto',
  inline: 'md-inline',
};

function scrollToHeading(id: string) {
  // scrollIntoView targets the nearest scroll container (the app-shell main),
  // so heading anchors work without depending on window scroll.
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

/**
 * Syntax highlighting happens in the BROWSER only. The old setup ran shiki
 * inside the SSR worker, and its per-isolate init (17 language grammars) plus
 * per-article highlighting blew through the free-tier CPU limit on longer
 * posts — intermittent 1102/503s. Plain code blocks SSR instantly; the colors
 * land a beat later, client-side, and shiki never enters the server bundle.
 */
let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  highlighterPromise ??= (async () => {
    const { createHighlighterCore } = await import('shiki/core');
    // JS regex engine, NOT oniguruma WASM: WebAssembly.instantiate failed
    // intermittently under memory/CPU pressure (logs 2026-07-26). In the
    // browser that constraint doesn't apply, but the engine choice stays.
    const { createJavaScriptRegexEngine } = await import(
      'shiki/engine/javascript'
    );
    return createHighlighterCore({
      themes: [
        import('shiki/themes/vitesse-light.mjs'),
        import('shiki/themes/vitesse-dark.mjs'),
      ],
      langs: [
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/jsx.mjs'),
        import('shiki/langs/tsx.mjs'),
        import('shiki/langs/html.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/yaml.mjs'),
        import('shiki/langs/markdown.mjs'),
        import('shiki/langs/cpp.mjs'),
        import('shiki/langs/c.mjs'),
        import('shiki/langs/go.mjs'),
        import('shiki/langs/java.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/rust.mjs'),
        import('shiki/langs/sql.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    });
  })();
  return highlighterPromise;
}

/**
 * Wraps a <pre> with a Copy button, then upgrades it to a shiki-highlighted
 * block in the browser. Reads the rendered textContent (post-markdown) so it
 * works regardless of how the code was tokenized.
 */
function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const text = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (non-secure context / no permission) — no-op.
    }
  }, []);

  useEffect(() => {
    const pre = preRef.current;
    const code = pre?.querySelector('code');
    if (!pre || !code || code.dataset.highlighted) {
      return;
    }
    const lang = /language-([\w-]+)/.exec(code.className)?.[1] ?? 'text';
    const raw = code.textContent ?? '';
    let cancelled = false;
    (async () => {
      try {
        const highlighter = await getHighlighter();
        if (cancelled) return;
        const html = highlighter.codeToHtml(raw, {
          lang,
          themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
        });
        if (cancelled) return;
        // codeToHtml returns a full <pre> — keep OUR pre (classes, copy
        // button, refs) and lift shiki's <code> body + theme vars into it.
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const shikiPre = doc.querySelector('pre');
        const shikiCode = shikiPre?.querySelector('code');
        if (!shikiPre || !shikiCode) return;
        pre.classList.add(...shikiPre.classList);
        const style = shikiPre.getAttribute('style');
        if (style) pre.setAttribute('style', style);
        code.innerHTML = shikiCode.innerHTML;
        code.dataset.highlighted = 'true';
      } catch {
        // Highlighting is progressive enhancement — plain code stays.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={CODE_CLASSES.wrap}>
      <button
        type='button'
        onClick={onCopy}
        aria-label='Copy code'
        className={CODE_CLASSES.copy}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre ref={preRef} className={CODE_CLASSES.pre}>
        {children}
      </pre>
    </div>
  );
}

export function Markdown({ content }: MarkdownProps) {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#')) {
      return;
    }

    requestAnimationFrame(() => {
      const id = decodeURIComponent(hash.slice(1));
      scrollToHeading(id);
    });
  }, []);

  return (
    <article className='md'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h2: ({ children }) => {
            const id = typeof children === 'string' ? children : '';

            return (
              <h2 id={id} className='scroll-mt-20'>
                <a
                  href={`#${id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    window.history.pushState('', '', `#${id}`);
                    scrollToHeading(id);
                  }}
                >
                  {id}
                </a>
              </h2>
            );
          },
          p: ({ children }) => <p>{children}</p>,
          a: ({ href, children }) => (
            <a href={href} target='_blank' rel='noreferrer'>
              {children}
            </a>
          ),
          strong: ({ children }) => <b className='font-bold'>{children}</b>,
          ul: ({ children }) => <ul>{children}</ul>,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children }) => {
            // Block code from shiki carries `language-*` — but some shiki
            // versions drop it, so also treat multi-line content as block.
            // Without this, a whole code block falls into the inline-code
            // style whose border renders under EVERY line box.
            const isBlock =
              /language-/.test(className ?? '') ||
              String(children).includes('\n');
            return isBlock ? (
              <code className={className}>{children}</code>
            ) : (
              <code className={CODE_CLASSES.inline}>{children}</code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
