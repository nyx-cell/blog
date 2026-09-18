import type { Comment, CommentStatus } from '@blog/shared';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { CommentMarkdown } from '../../components/comment-markdown.js';
import { ConfirmDialog } from '../../components/confirm-dialog.js';
import {
  deleteCommentServerFn,
  listCommentsServerFn,
  setCommentStatusServerFn,
} from '../../lib/comments-service.js';

export const Route = createFileRoute('/admin/comments')({
  head: () => ({ meta: [{ title: 'Admin · 评论审核' }] }),
  // listCommentsServerFn calls requireAdmin() internally, so non-admins are
  // bounced away (to /login or /) before this page renders.
  loader: async () => listCommentsServerFn({ data: {} }),
  component: AdminCommentsPage,
});

type StatusFilter = CommentStatus | 'all';

const STATUS_FILTERS: StatusFilter[] = ['all', 'visible', 'hidden', 'spam'];
const STATUS_LABEL: Record<StatusFilter, string> = {
  all: '全部',
  visible: '可见',
  hidden: '隐藏',
  spam: '垃圾',
};

const STATUS_BADGE: Record<CommentStatus, string> = {
  visible:
    'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-chart-2',
  hidden:
    'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-muted-foreground/60',
  spam: 'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-destructive',
};

function AdminCommentsPage() {
  const { comments: initial } = Route.useLoaderData();
  const [comments, setComments] = useState<Comment[]>(initial);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [slugQuery, setSlugQuery] = useState('');
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = slugQuery.trim().toLowerCase();
    return comments.filter((comment) => {
      if (statusFilter !== 'all' && comment.status !== statusFilter) {
        return false;
      }
      if (needle && !comment.slug.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [comments, statusFilter, slugQuery]);

  async function setStatus(id: string, status: CommentStatus) {
    setError(null);
    setBusy((prev) => new Set(prev).add(id));
    try {
      await setCommentStatusServerFn({ data: { id, status } });
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id ? { ...comment, status } : comment,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function remove(id: string) {
    setError(null);
    setBusy((prev) => new Set(prev).add(id));
    try {
      await deleteCommentServerFn({ data: { id } });
      setComments((prev) => prev.filter((comment) => comment.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败，请重试');
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className='mx-auto w-full self-start max-w-5xl px-4 pt-8 pb-12 sm:px-6'>
      <div className='flex flex-wrap items-baseline gap-2.5 mb-2'>
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          comments --moderate
        </span>
      </div>
      <Link
        to='/admin'
        className='text-muted-foreground hover:text-foreground mb-4 inline-block text-sm'
      >
        ← 返回管理
      </Link>
      <h1 className='text-lg font-semibold text-foreground mb-4'>评论审核</h1>

      <div className='mb-4 flex flex-wrap items-center gap-2'>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type='button'
            onClick={() => setStatusFilter(filter)}
            className={`cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary px-2.5 py-0.75 text-xs ${
              statusFilter === filter
                ? 'border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
                : ''
            }`}
          >
            {STATUS_LABEL[filter]}
          </button>
        ))}
        <input
          type='search'
          value={slugQuery}
          onChange={(event) => setSlugQuery(event.target.value)}
          placeholder='按 slug 筛选…'
          className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)] ml-auto w-48 py-1 text-xs'
        />
      </div>

      {error ? (
        <p className='my-2.5 text-sm text-destructive mb-3'>{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <div className='text-muted-foreground/60 px-6 py-16 text-center'>
          # 没有符合条件的评论。
        </div>
      ) : (
        <ul className='flex flex-col gap-3'>
          {filtered.map((comment) => (
            <li
              key={comment.id}
              className='rounded-md border border-dashed border-border bg-secondary p-4'
            >
              <div className='mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                <span className='font-semibold'>{comment.author.name}</span>
                {comment.author.role === 'admin' ? (
                  <span className='inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-primary'>
                    AUTHOR
                  </span>
                ) : null}
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[comment.status]}`}
                >
                  {STATUS_LABEL[comment.status]}
                </span>
                <Link
                  to='/blog/$slug'
                  params={{ slug: comment.slug }}
                  className='opacity-60 hover:opacity-100'
                >
                  /blog/{comment.slug}
                </Link>
                <span className='opacity-50'>
                  {new Date(comment.createdAt).toLocaleString('en-US')}
                </span>
              </div>
              <CommentMarkdown content={comment.body} />
              <div className='mt-3 flex flex-wrap gap-3 text-xs'>
                {comment.status !== 'hidden' ? (
                  <button
                    type='button'
                    disabled={busy.has(comment.id)}
                    onClick={() => setStatus(comment.id, 'hidden')}
                    className='opacity-70 hover:opacity-100 disabled:opacity-40'
                  >
                    隐藏
                  </button>
                ) : null}
                {comment.status !== 'spam' ? (
                  <button
                    type='button'
                    disabled={busy.has(comment.id)}
                    onClick={() => setStatus(comment.id, 'spam')}
                    className='text-muted-foreground hover:text-foreground disabled:opacity-40'
                  >
                    标垃圾
                  </button>
                ) : null}
                {comment.status !== 'visible' ? (
                  <button
                    type='button'
                    disabled={busy.has(comment.id)}
                    onClick={() => setStatus(comment.id, 'visible')}
                    className='text-muted-foreground hover:text-foreground disabled:opacity-40'
                  >
                    恢复
                  </button>
                ) : null}
                <button
                  type='button'
                  disabled={busy.has(comment.id)}
                  onClick={() => {
                    setPendingDelete(comment.id);
                  }}
                  className='ml-auto text-destructive/70 hover:text-destructive disabled:opacity-40'
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        command='rm comment'
        description='永久删除这条评论？此操作不可恢复。'
        confirmLabel='delete'
        onConfirm={() => {
          const id = pendingDelete;
          setPendingDelete(null);
          if (id) {
            remove(id);
          }
        }}
      />
    </div>
  );
}
