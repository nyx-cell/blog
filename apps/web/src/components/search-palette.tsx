import type { PostSummary } from '@blog/shared';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { searchPostsServerFn } from '../lib/blog-service.js';
import { searchPalette, useSearchPaletteOpen } from './search-palette-store.js';

/* Terminal grep palette: a shadcn Dialog + cmdk reskinned with utilities —
   drops from the top like a terminal window, `~ %` prompt instead of a
   magnifier, mono throughout. ≤640px it becomes a full-height sheet with the
   ✕ restored (no esc / arrows on touch). All the [data-slot=…] selectors
   target our own ui/command internals. */
const PANEL =
  'top-[14vh] translate-y-0 max-w-[min(640px,calc(100vw-32px))] rounded-xl border border-border bg-card p-0 font-mono shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:max-w-[min(640px,calc(100vw-32px))] [&_[data-slot=dialog-close]]:hidden max-[640px]:top-0 max-[640px]:inset-x-0 max-[640px]:h-dvh max-[640px]:max-w-none max-[640px]:translate-x-0 max-[640px]:translate-y-0 max-[640px]:flex max-[640px]:flex-col max-[640px]:rounded-none max-[640px]:border-t-0 max-[640px]:border-x-0 max-[640px]:[&_[data-slot=dialog-close]]:flex max-[640px]:[&_[data-slot=dialog-close]]:text-foreground';

const TERMINAL_CMD =
  'rounded-xl border-none bg-card text-foreground [&_[data-slot=command-empty]]:px-4 [&_[data-slot=command-empty]]:py-4.5 [&_[data-slot=command-empty]]:text-left [&_[data-slot=command-empty]]:text-sm [&_[data-slot=command-empty]]:text-muted-foreground/60 [&_[data-slot=command-input]]:h-auto [&_[data-slot=command-input]]:px-0 [&_[data-slot=command-input]]:text-base [&_[data-slot=command-input]]:text-foreground [&_[data-slot=command-input]]:caret-primary [&_[data-slot=command-input]]:placeholder:text-muted-foreground/60 [&_[data-slot=command-input-wrapper]]:gap-2.5 [&_[data-slot=command-input-wrapper]]:border-b [&_[data-slot=command-input-wrapper]]:border-dashed [&_[data-slot=command-input-wrapper]]:border-border [&_[data-slot=command-input-wrapper]]:px-4 [&_[data-slot=command-input-wrapper]]:py-3.25 [&_[data-slot=command-input-wrapper]]:max-[640px]:pr-11 [&_[data-slot=command-input-wrapper]>svg]:hidden [&_[data-slot=command-item]]:items-baseline [&_[data-slot=command-item]]:gap-3.5 [&_[data-slot=command-item]]:rounded [&_[data-slot=command-item]]:px-2.5 [&_[data-slot=command-item]]:py-2 [&_[data-slot=command-item]]:text-sm [&_[data-slot=command-item]]:data-[selected=true]:bg-accent [&_[data-slot=command-list]]:h-auto [&_[data-slot=command-list]]:max-h-80 [&_[data-slot=command-list]]:py-1.5 [&_[data-slot=command-list]]:max-[640px]:max-h-none [&_[data-slot=command-list]]:max-[640px]:min-h-0 [&_[data-slot=command-list]]:max-[640px]:flex-1 max-[640px]:min-h-0 max-[640px]:flex-1';

/**
 * Global Cmd/Ctrl+K search palette. Uses the shadcn Command + Dialog
 * primitives, styled by the shared tokens. Search runs server-side
 * (searchPostsServerFn) so visibility filtering stays authoritative — restricted
 * posts never appear as suggestions. `shouldFilter={false}` because we feed our
 * own server results; cmdk's built-in client filter is disabled.
 */
export function SearchPalette() {
  const open = useSearchPaletteOpen();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PostSummary[]>([]);
  const navigate = useNavigate();

  // Global Cmd/Ctrl+K toggle.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchPalette.toggle();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Debounced server search while open; reset on close.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      searchPostsServerFn({ data: { q } })
        .then(setResults)
        .catch(() => setResults([]));
    }, 150);
    return () => clearTimeout(handle);
  }, [open, query]);

  function go(slug: string) {
    searchPalette.close();
    navigate({ to: '/blog/$slug', params: { slug } });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) =>
        next ? searchPalette.open() : searchPalette.close()
      }
    >
      <DialogContent className={PANEL}>
        <Command shouldFilter={false} className={TERMINAL_CMD}>
          <CommandInput
            leading={
              <span className='flex-none text-base text-primary'>~ %</span>
            }
            icon={null}
            value={query}
            onValueChange={setQuery}
            placeholder="grep -ri '关键词' ~/posts"
          />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? '# no matches found' : '# type to grep ~/posts'}
            </CommandEmpty>
            <CommandGroup>
              {results.map((post) => (
                <CommandItem
                  key={post.slug}
                  value={post.slug}
                  onSelect={() => go(post.slug)}
                >
                  <span className='min-w-[6ch] text-xs text-muted-foreground/60'>
                    {new Date(post.publishedAt).toISOString().slice(0, 7)}
                  </span>
                  <span className='flex-1 overflow-hidden text-ellipsis whitespace-nowrap data-[selected=true]:text-primary'>
                    {post.title}
                  </span>
                  {post.visibility !== 'public' ? (
                    <span className='text-xs text-muted-foreground'>
                      {post.visibility}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className='border-t border-border px-4 py-1.75 text-xs text-muted-foreground/60 max-[640px]:hidden'>
            ↑↓ 选择 · ↵ 打开 · esc 关闭 · 结果按当前身份过滤
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
