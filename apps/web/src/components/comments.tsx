'use client';

import type { Comment, CommentThread, SessionUser } from '@blog/shared';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  createCommentServerFn,
  deleteCommentServerFn,
  getCommentsServerFn,
} from '../lib/comments-service.js';
import { CommentMarkdown } from './comment-markdown.js';

type CommentsProps = {
  slug: string;
  initialComments: CommentThread[];
  initialHasMore: boolean;
  initialTotal: number;
  sessionUser: SessionUser | null;
};

const PAGE_SIZE = 20;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return iso;
  }
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) {
    return '刚刚';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} 天前`;
  }
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type ComposerProps = {
  placeholder: string;
  submitting: boolean;
  onSubmit: (body: string) => Promise<void>;
  compact?: boolean;
};

function Composer({
  placeholder,
  submitting,
  onSubmit,
  compact,
}: ComposerProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const remaining = 2000 - body.length;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) {
      return;
    }
    setError(null);
    try {
      await onSubmit(trimmed);
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '评论失败，请重试');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='my-3 overflow-hidden rounded-lg border flex flex-col gap-2'
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className='w-full resize-y rounded-md border border-border bg-secondary px-3 py-2.25 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary'
      />
      <div className='flex items-center justify-between gap-2'>
        <span className='text-xs text-muted-foreground/60'>
          {remaining < 200 ? `${remaining} 字剩余` : '支持 Markdown'}
          {error ? (
            <span className='my-2.5 text-sm text-destructive inline'>
              {'✗ '}
              {error}
            </span>
          ) : null}
        </span>
        <button
          type='submit'
          disabled={submitting || !body.trim()}
          className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
        >
          {submitting ? '发送中…' : 'reply'}
        </button>
      </div>
    </form>
  );
}

type CommentItemProps = {
  thread: CommentThread;
  sessionUser: SessionUser | null;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replySubmitting: Set<string>;
};

function CommentItem({
  thread,
  sessionUser,
  onReply,
  onDelete,
  replyingTo,
  setReplyingTo,
  replySubmitting,
}: CommentItemProps) {
  const canAct =
    sessionUser != null && (thread.isOwn || sessionUser.role === 'admin');

  async function handleDelete() {
    if (!canAct) {
      return;
    }
    if (!window.confirm('删除这条评论？')) {
      return;
    }
    // onDelete (the parent handleDelete) catches its own errors and surfaces
    // them via topError, so it does not throw — no swallow, no unhandled reject.
    await onDelete(thread.id);
  }

  return (
    <li className='flex flex-col gap-2'>
      <CommentView
        comment={thread}
        canAct={canAct}
        canReply={sessionUser != null}
        onReply={() =>
          setReplyingTo(replyingTo === thread.id ? null : thread.id)
        }
        onDelete={handleDelete}
      />

      {replyingTo === thread.id && sessionUser ? (
        <div className='ml-10'>
          <Composer
            placeholder={`回复 @${thread.author.name}…`}
            submitting={replySubmitting.has(thread.id)}
            onSubmit={(body) => onReply(thread.id, body)}
            compact
          />
        </div>
      ) : null}

      {thread.replies.length > 0 ? (
        <ul className='flex flex-col gap-3 border-t border-dashed border-border bg-accent px-3.5 py-2.5'>
          {thread.replies.map((reply) => {
            const replyCanAct =
              sessionUser != null &&
              (reply.isOwn || sessionUser.role === 'admin');
            return (
              <CommentView
                key={reply.id}
                comment={reply}
                canAct={replyCanAct}
                canReply={false}
                onReply={undefined}
                onDelete={async () => {
                  if (!window.confirm('删除这条回复？')) {
                    return;
                  }
                  await onDelete(reply.id);
                }}
              />
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

type CommentViewProps = {
  comment: Comment;
  canAct: boolean;
  canReply?: boolean;
  onReply?: () => void;
  onDelete: () => void | Promise<void>;
};

function CommentView({
  comment,
  canAct,
  canReply,
  onReply,
  onDelete,
}: CommentViewProps) {
  return (
    <div className='my-3 overflow-hidden rounded-lg border border-border'>
      <div className='flex items-center gap-2.5 border-b border-border bg-secondary px-3.5 py-2 text-sm text-muted-foreground'>
        <span className='text-foreground'>{comment.author.name}</span>
        {comment.author.role === 'admin' ? (
          <span className='rounded-full bg-primary px-1.75 py-px text-xs font-bold leading-normal text-primary-foreground'>
            AUTHOR
          </span>
        ) : null}
        {comment.status !== 'visible' ? (
          <span className='rounded-sm border border-current px-1.5 text-xs font-bold leading-relaxed tracking-wide text-muted-foreground'>
            {comment.status}
          </span>
        ) : null}
        <span>{formatRelative(comment.createdAt)}</span>
      </div>
      <div className='px-3.5 py-2.5'>
        <CommentMarkdown content={comment.body} />
      </div>
      {canReply && onReply ? (
        <div className='flex gap-3.5 px-3.5 pb-2.5 text-xs [&_button]:cursor-pointer [&_button]:bg-none [&_button]:text-muted-foreground [&_button:hover]:text-primary'>
          <button type='button' onClick={onReply}>
            reply
          </button>
          {canAct ? (
            <button
              type='button'
              className='hover:text-destructive!'
              onClick={() => onDelete()}
            >
              rm
            </button>
          ) : null}
        </div>
      ) : null}
      {!(canReply && onReply) && canAct ? (
        <div className='flex gap-3.5 px-3.5 pb-2.5 text-xs [&_button]:cursor-pointer [&_button]:bg-none [&_button]:text-muted-foreground [&_button:hover]:text-primary'>
          <button
            type='button'
            className='hover:text-destructive!'
            onClick={() => onDelete()}
          >
            rm
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Comments({
  slug,
  initialComments,
  initialHasMore,
  initialTotal,
  sessionUser,
}: CommentsProps) {
  const [threads, setThreads] = useState<CommentThread[]>(initialComments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState<Set<string>>(
    () => new Set(),
  );

  async function handleCreateTopLevel(body: string) {
    setSubmitting(true);
    try {
      const { comment } = await createCommentServerFn({
        data: { slug, body },
      });
      // Newest-first: a fresh top-level comment goes to the front.
      setThreads((prev) => [{ ...comment, replies: [] }, ...prev]);
      setTotal((count) => count + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string, body: string) {
    setReplySubmitting((prev) => new Set(prev).add(parentId));
    try {
      const { comment } = await createCommentServerFn({
        data: { slug, body, parentId },
      });
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === parentId
            ? { ...thread, replies: [...thread.replies, comment] }
            : thread,
        ),
      );
      setReplyingTo(null);
    } finally {
      setReplySubmitting((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  }

  async function handleDelete(id: string) {
    setTopError(null);
    try {
      await deleteCommentServerFn({ data: { id } });
    } catch (err) {
      setTopError(err instanceof Error ? err.message : '删除失败，请重试');
      return;
    }
    const wasTopLevel = threads.some((thread) => thread.id === id);
    setThreads((prev) =>
      prev
        .map((thread) => ({
          ...thread,
          replies: thread.replies.filter((reply) => reply.id !== id),
        }))
        .filter((thread) => thread.id !== id),
    );
    if (wasTopLevel) {
      setTotal((count) => Math.max(0, count - 1));
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const result = await getCommentsServerFn({
        data: { slug, offset: threads.length, limit: PAGE_SIZE },
      });
      setThreads((prev) => [...prev, ...result.comments]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setTopError(null);
    } catch (err) {
      setTopError(err instanceof Error ? err.message : '加载更多失败');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className='mt-10'>
      <div className='flex flex-wrap items-baseline gap-2.5 mb-4'>
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          comments --on {slug}
        </span>{' '}
        <span className='text-muted-foreground/60'>({total})</span>
      </div>

      {sessionUser ? (
        <div className='mb-6'>
          <Composer
            placeholder='写下你的评论…（支持 Markdown）'
            submitting={submitting}
            onSubmit={handleCreateTopLevel}
          />
        </div>
      ) : (
        <p className='text-muted-foreground/60 mb-6'>
          # <Link to='/login'>login</Link> 后即可评论。
        </p>
      )}

      {topError ? (
        <p className='my-2.5 text-sm text-destructive mb-4'>{topError}</p>
      ) : null}

      {threads.length === 0 ? (
        <p className='text-muted-foreground/60 py-8 text-center'>
          # 还没有评论，来抢沙发。
        </p>
      ) : (
        <ul className='flex flex-col gap-3'>
          {threads.map((thread) => (
            <CommentItem
              key={thread.id}
              thread={thread}
              sessionUser={sessionUser}
              onReply={handleReply}
              onDelete={handleDelete}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replySubmitting={replySubmitting}
            />
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={handleLoadMore}
            disabled={loadingMore}
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary'
          >
            {loadingMore ? '加载中…' : 'tail -f'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
