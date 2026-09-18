import { POST_VISIBILITIES } from '@blog/shared';
import { useHydrated, useRouter } from '@tanstack/react-router';
import { useReducer, useState } from 'react';
import {
  type AdminPost,
  deletePostServerFn,
  upsertPostServerFn,
} from '../lib/admin-service.js';
import { ConfirmDialog } from './confirm-dialog.js';
import { MarkdownEditor } from './markdown-editor.js';
import { TagInput } from './tag-input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

function todayIso(): string {
  return new Date().toISOString();
}

// Editable form fields, kept as one object driven by a reducer. `tags` is a
// real string[] now (the TagInput manages add/remove); no comma-splitting.
type FormState = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  visibility: AdminPost['visibility'];
  password: string;
  status: AdminPost['status'];
  publishedAt: string;
  body: string;
};

type FormAction = {
  [K in keyof FormState]: { field: K; value: FormState[K] };
}[keyof FormState];

function formReducer(state: FormState, action: FormAction): FormState {
  return { ...state, [action.field]: action.value };
}

function toFormState(post: AdminPost): FormState {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags,
    visibility: post.visibility,
    password: post.password,
    status: post.status,
    publishedAt: post.publishedAt.slice(0, 10),
    body: post.body,
  };
}

const EMPTY: AdminPost = {
  slug: '',
  title: '',
  description: '',
  body: '',
  visibility: 'public',
  password: '',
  status: 'published',
  tags: [],
  publishedAt: todayIso(),
};

export function PostEditor({
  initial,
  mode,
  allTags = [],
}: {
  initial?: AdminPost | null;
  mode: 'new' | 'edit';
  allTags?: string[];
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [fields, dispatch] = useReducer(
    formReducer,
    initial ?? EMPTY,
    toFormState,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    dispatch({ field, value } as FormAction);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertPostServerFn({
        data: {
          slug: fields.slug,
          title: fields.title,
          description: fields.description,
          body: fields.body,
          visibility: fields.visibility,
          password: fields.password,
          status: fields.status,
          tags: fields.tags,
          publishedAt: new Date(fields.publishedAt).toISOString(),
        },
      });
      await router.navigate({ to: '/admin' });
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setSaving(true);
    try {
      await deletePostServerFn({ data: { slug: fields.slug } });
      await router.navigate({ to: '/admin' });
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {/* Before hydration, React can overwrite typed input and submission
          bypasses onSubmit as a native GET. */}
      <fieldset
        disabled={!hydrated}
        className='m-0 grid min-w-0 gap-5 border-0 p-0'
      >
        {error ? (
          <p role='alert' className='my-2.5 text-sm text-destructive'>
            {error}
          </p>
        ) : null}

        <section className='rounded-md border border-dashed border-border bg-secondary p-4 grid gap-4'>
          <label className='grid'>
            <span className='mb-1.25 block text-xs text-muted-foreground'>
              <span className='text-primary'>▸ </span>
              标题
            </span>
            <input
              className='w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
              value={fields.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder='文章标题'
              required
            />
          </label>

          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='grid'>
              <span className='mb-1.25 block text-xs text-muted-foreground'>
                <span className='text-primary'>▸ </span>
                Slug
              </span>
              <input
                className='w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
                value={fields.slug}
                onChange={(event) => setField('slug', event.target.value)}
                placeholder='my-post'
                disabled={mode === 'edit'}
                required
              />
            </label>
            <label className='grid'>
              <span className='mb-1.25 block text-xs text-muted-foreground'>
                <span className='text-primary'>▸ </span>
                发布日期
              </span>
              <input
                type='date'
                className='w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
                value={fields.publishedAt}
                onChange={(event) =>
                  setField('publishedAt', event.target.value)
                }
                required
              />
            </label>
          </div>

          <label className='grid'>
            <span className='mb-1.25 block text-xs text-muted-foreground'>
              <span className='text-primary'>▸ </span>
              摘要
            </span>
            <textarea
              className='w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)] min-h-16 resize-y'
              value={fields.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder='一句话描述这篇文章'
              rows={2}
            />
          </label>
        </section>

        <section className='rounded-md border border-dashed border-border bg-secondary p-4 grid gap-4'>
          <div className='grid gap-2'>
            <span className='mb-1.25 block text-xs text-muted-foreground'>
              <span className='text-primary'>▸ </span>
              标签
            </span>
            <TagInput
              value={fields.tags}
              onChange={(tags) => setField('tags', tags)}
              placeholder='输入后回车添加，或点击下方已有标签'
              suggestions={allTags}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='grid gap-2'>
              <span className='mb-1.25 block text-xs text-muted-foreground'>
                <span className='text-primary'>▸ </span>
                可见性
              </span>
              <Select
                value={fields.visibility}
                onValueChange={(value) =>
                  setField('visibility', value as FormState['visibility'])
                }
              >
                <SelectTrigger aria-label='可见性'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_VISIBILITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <span className='mb-1.25 block text-xs text-muted-foreground'>
                <span className='text-primary'>▸ </span>
                状态
              </span>
              <Select
                value={fields.status}
                onValueChange={(value) =>
                  setField('status', value as FormState['status'])
                }
              >
                <SelectTrigger aria-label='状态'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='published'>published</SelectItem>
                  <SelectItem value='draft'>draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fields.visibility === 'password' ? (
              <label className='grid'>
                <span className='mb-1.25 block text-xs text-muted-foreground'>
                  <span className='text-primary'>▸ </span>
                  密码
                </span>
                <input
                  className='w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
                  value={fields.password}
                  onChange={(event) => setField('password', event.target.value)}
                  placeholder='访问密码'
                />
              </label>
            ) : null}
          </div>
        </section>

        <section className='grid gap-2'>
          <span className='mb-1.25 block text-xs text-muted-foreground'>
            <span className='text-primary'>▸ </span>
            正文（Markdown）
          </span>
          <MarkdownEditor
            value={fields.body}
            onChange={(body) => setField('body', body)}
          />
        </section>

        <div className='flex items-center gap-3'>
          <button
            type='submit'
            disabled={saving}
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
          >
            {saving ? '保存中…' : '保存'}
          </button>
          {mode === 'edit' ? (
            <button
              type='button'
              onClick={() => {
                setConfirmDelete(true);
              }}
              disabled={saving}
              className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-[color-mix(in_srgb,var(--destructive)_45%,transparent)] text-destructive hover:border-destructive hover:bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] hover:text-destructive'
            >
              删除
            </button>
          ) : null}
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          command='rm post'
          description={`确定删除文章 “${fields.slug}”？此操作不可恢复。`}
          confirmLabel='delete'
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete();
          }}
        />
      </fieldset>
    </form>
  );
}
