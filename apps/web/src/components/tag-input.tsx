import { X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** All tags already in use across posts, most-used first. */
  suggestions?: string[];
};

/**
 * Chip-style tag editor: type and press Enter/comma (half- or full-width) to
 * add a tag, click × (or Backspace on an empty field) to remove one. Existing
 * tags from other posts are offered as one-click suggestions (filtered by the
 * current draft) so reuse beats retyping. The wire format stays a plain
 * string[] — no comma-splitting on submit.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  function commit(raw: string) {
    const tag = raw.trim();
    setDraft('');
    if (!tag) {
      return;
    }
    const duplicate = value.some(
      (existing) => existing.toLowerCase() === tag.toLowerCase(),
    );
    if (duplicate) {
      return;
    }
    onChange([...value, tag]);
  }

  function remove(tag: string) {
    onChange(value.filter((existing) => existing !== tag));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
      event.preventDefault();
      commit(draft);
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  }

  const needle = draft.trim().toLowerCase();
  const available = suggestions
    .filter(
      (tag) =>
        !value.some((existing) => existing.toLowerCase() === tag.toLowerCase()),
    )
    .filter((tag) => !needle || tag.toLowerCase().includes(needle))
    .slice(0, 12);
  const showSuggestions = focused && available.length > 0;

  return (
    <div className='grid gap-2'>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus convenience; the enclosed <input> is the keyboard-accessible control. */}
      <div
        className='flex cursor-text flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 focus-within:border-primary focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
        onMouseDown={(event) => {
          // Focus the input when pressing anywhere on the field (not on a chip).
          if (event.target === event.currentTarget) {
            event.preventDefault();
            event.currentTarget.querySelector('input')?.focus();
          }
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className='inline-flex items-center gap-1 rounded-sm border border-border px-1.75 py-px text-xs text-primary [&_button]:text-muted-foreground/60 [&_button:hover]:text-destructive'
          >
            {tag}
            <button
              type='button'
              onClick={() => {
                remove(tag);
              }}
              aria-label={`移除标签 ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
            commit(draft);
          }}
          placeholder={
            value.length === 0 ? (placeholder ?? '输入后回车添加') : ''
          }
          className='min-w-[8ch] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40'
        />
      </div>
      {showSuggestions ? (
        <div className='flex flex-wrap items-center gap-1.5'>
          {available.map((tag) => (
            <button
              key={tag}
              type='button'
              className='cursor-pointer rounded-sm border border-dashed border-border bg-none px-1.75 py-px text-xs text-chart-1 hover:border-primary hover:text-primary'
              // preventDefault keeps the input focused (no blur commit).
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                commit(tag);
              }}
            >
              + {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
