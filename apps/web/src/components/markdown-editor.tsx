import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Quote,
} from 'lucide-react';
import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Markdown } from './markdown.js';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type Mode = 'write' | 'split' | 'preview';

const EDITOR_HEIGHT = 'h-115';

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>('split');
  const [uploading, setUploading] = useState(false);
  // shiki highlighting is expensive; keep the textarea snappy by deferring the
  // rendered preview a tick behind the typed text.
  const previewContent = useDeferredValue(value);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  // Restore the caret/selection after a toolbar action mutates the value.
  useEffect(() => {
    const el = ref.current;
    const next = pendingSelection.current;
    if (!el || !next) {
      return;
    }
    el.focus();
    el.setSelectionRange(next.start, next.end);
    pendingSelection.current = null;
  });

  /** Wrap the current selection with `before`/`after`, inserting a placeholder
   * when nothing is selected. */
  function wrap(before: string, after: string, placeholder = 'text') {
    const el = ref.current;
    if (!el) {
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    const selStart = start + before.length;
    pendingSelection.current = {
      start: selStart,
      end: selStart + selected.length,
    };
  }

  /** Prefix every line touched by the current selection (toggles the prefix). */
  function prefixLines(prefix: string) {
    const el = ref.current;
    if (!el) {
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const block = value.slice(lineStart, end);
    const allPrefixed = block
      .split('\n')
      .every((line) => line.startsWith(prefix) || line === '');
    const newBlock = block
      .split('\n')
      .map((line) =>
        allPrefixed
          ? line.slice(prefix.length)
          : line.startsWith(prefix)
            ? line
            : prefix + line,
      )
      .join('\n');
    const next = value.slice(0, lineStart) + newBlock + value.slice(end);
    onChange(next);
    pendingSelection.current = {
      start: lineStart,
      end: lineStart + newBlock.length,
    };
  }

  function insertCodeBlock() {
    const el = ref.current;
    if (!el) {
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const inner = value.slice(start, end) || 'code';
    const block = `\`\`\`\n${inner}\n\`\`\``;
    const next = value.slice(0, start) + block + value.slice(end);
    onChange(next);
    pendingSelection.current = {
      start: start + 4,
      end: start + 4 + inner.length,
    };
  }

  /** Upload pasted/dropped image files to R2 and insert markdown at the caret.
   *  Requires an admin session (the /api/upload route enforces it). */
  async function insertImageFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (!images.length || !ref.current) {
      return;
    }
    const el = ref.current;
    let pos = el.selectionStart ?? value.length;
    let next = value;
    setUploading(true);
    try {
      for (const file of images) {
        const form = new FormData();
        form.append('file', file);
        let url: string | undefined;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: form,
          });
          if (res.ok) {
            const data = (await res.json()) as { url?: string };
            url = data.url;
          }
        } catch {
          // Network error / abort — skip this file, keep going.
        }
        if (!url) {
          continue;
        }
        const alt = file.name.replace(/\.[^.]+$/, '') || 'image';
        const md = `![${alt}](${url})`;
        next = next.slice(0, pos) + md + next.slice(pos);
        pos += md.length;
      }
      if (next !== value) {
        onChange(next);
        pendingSelection.current = { start: pos, end: pos };
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className='overflow-hidden rounded-md border border-border bg-secondary'>
      <div className='flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5'>
        <ToolButton label='加粗' onClick={() => wrap('**', '**')}>
          <Bold size={16} />
        </ToolButton>
        <ToolButton label='斜体' onClick={() => wrap('*', '*')}>
          <Italic size={16} />
        </ToolButton>
        <Divider />
        <ToolButton label='一级标题' onClick={() => prefixLines('# ')}>
          <Heading1 size={16} />
        </ToolButton>
        <ToolButton label='二级标题' onClick={() => prefixLines('## ')}>
          <Heading2 size={16} />
        </ToolButton>
        <Divider />
        <ToolButton label='引用' onClick={() => prefixLines('> ')}>
          <Quote size={16} />
        </ToolButton>
        <ToolButton label='列表' onClick={() => prefixLines('- ')}>
          <List size={16} />
        </ToolButton>
        <ToolButton label='行内代码' onClick={() => wrap('`', '`', 'code')}>
          <Code size={16} />
        </ToolButton>
        <ToolButton label='代码块' onClick={insertCodeBlock}>
          <span className='font-mono text-xs leading-none'>{'{ }'}</span>
        </ToolButton>
        <Divider />
        <ToolButton
          label='链接'
          onClick={() => wrap('[', '](https://)', '链接文字')}
        >
          <LinkIcon size={16} />
        </ToolButton>
        <ToolButton
          label='图片'
          onClick={() => wrap('![', '](https://)', '替代文字')}
        >
          <ImageIcon size={16} />
        </ToolButton>
        {uploading ? (
          <span className='ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <Loader2 size={12} className='animate-spin' />
            上传中…
          </span>
        ) : null}

        <div className='ml-auto flex items-center gap-1'>
          <ModeButton
            active={mode === 'write'}
            onClick={() => setMode('write')}
          >
            编辑
          </ModeButton>
          <ModeButton
            active={mode === 'split'}
            onClick={() => setMode('split')}
          >
            分屏
          </ModeButton>
          <ModeButton
            active={mode === 'preview'}
            onClick={() => setMode('preview')}
          >
            预览
          </ModeButton>
        </div>
      </div>

      <div
        className={`grid ${mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'} ${EDITOR_HEIGHT}`}
      >
        {mode !== 'preview' ? (
          <textarea
            ref={ref}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData?.items ?? [])
                .map((item) => (item.kind === 'file' ? item.getAsFile() : null))
                .filter((file): file is File => file !== null);
              if (files.length > 0) {
                event.preventDefault();
                void insertImageFiles(files);
              }
            }}
            onDrop={(event) => {
              const files = Array.from(event.dataTransfer?.files ?? []);
              if (files.some((file) => file.type.startsWith('image/'))) {
                event.preventDefault();
                void insertImageFiles(files);
              }
            }}
            onDragOver={(event) => {
              if (
                Array.from(event.dataTransfer?.types ?? []).includes('Files')
              ) {
                event.preventDefault();
              }
            }}
            spellCheck={false}
            className={`h-full resize-none bg-background px-3 py-3 font-mono text-sm leading-6 text-foreground outline-none ${
              mode === 'split'
                ? 'border-b border-border lg:border-b-0 lg:border-r'
                : ''
            }`}
            placeholder='在这里写下 Markdown 正文…'
          />
        ) : null}
        {mode !== 'write' ? (
          <div
            className={`h-full overflow-auto bg-background px-4 py-3 text-sm leading-7 ${
              mode === 'split' ? 'hidden lg:block' : ''
            }`}
          >
            {value.trim() ? (
              <Markdown content={previewContent} />
            ) : (
              <p className='opacity-40'>暂无内容可预览。</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type='button'
      title={label}
      aria-label={label}
      onClick={onClick}
      className='flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:text-primary'
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className='mx-1 h-5 w-px bg-border' />;
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}
