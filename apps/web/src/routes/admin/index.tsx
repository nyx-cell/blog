import type { PostVisibility } from '@blog/shared';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  type AdminPost,
  listAdminPostsServerFn,
} from '../../lib/admin-service.js';

export const Route = createFileRoute('/admin/')({
  head: () => ({ meta: [{ title: 'Admin · 文章管理' }] }),
  loader: async () => listAdminPostsServerFn(),
  component: AdminListPage,
});

const visibilityStyles: Record<PostVisibility, string> = {
  public:
    'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-chart-2',
  member:
    'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-chart-1',
  vip: 'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-primary',
  admin:
    'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-destructive',
  password:
    'inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-muted-foreground/60',
};

function AdminListPage() {
  const { posts } = Route.useLoaderData();
  const draftCount = posts.filter(
    (post: AdminPost) => post.status === 'draft',
  ).length;

  return (
    <div className='mx-auto w-full self-start max-w-5xl px-4 pt-8 pb-12 sm:px-6'>
      <div className='flex flex-wrap items-baseline gap-2.5 mb-2'>
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          admin --manage
        </span>
      </div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-lg font-semibold text-foreground'>文章管理</h1>
          <p className='text-muted-foreground/60 mt-1'>
            # 共 {posts.length} 篇
            {draftCount > 0 ? ` · ${draftCount} 篇草稿` : ''}
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <Link
            to='/admin/comments'
            className='text-muted-foreground hover:text-foreground text-sm'
          >
            评论审核
          </Link>
          <Link
            to='/admin/new'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
          >
            + 新建文章
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className='text-muted-foreground/60 px-6 py-16 text-center'>
          # 还没有文章。点 “+ 新建文章” 写第一篇吧。
        </div>
      ) : (
        <div>
          <ul>
            {posts.map((post: AdminPost) => (
              <li
                key={post.slug}
                className='grid grid-cols-[1fr_auto] items-center gap-4 border-b border-dashed border-border px-1 py-2.5 last:border-b-0 hover:bg-accent max-[640px]:grid-cols-1 max-[640px]:gap-1.5'
              >
                <div className='min-w-0'>
                  <Link
                    to='/admin/$slug'
                    params={{ slug: post.slug }}
                    className='hover:text-primary block truncate'
                  >
                    {post.title || post.slug}
                  </Link>
                  <div className='text-muted-foreground/60 truncate text-xs'>
                    /blog/{post.slug}
                  </div>
                </div>
                <div className='flex flex-wrap items-center gap-1.5 sm:justify-end'>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${visibilityStyles[post.visibility]}`}
                  >
                    {post.visibility}
                  </span>
                  {post.status === 'draft' ? (
                    <span className='inline-block rounded-sm border border-current px-1.5 text-xs leading-relaxed font-bold tracking-wide text-primary'>
                      draft
                    </span>
                  ) : null}
                  <Link
                    to='/blog/$slug'
                    params={{ slug: post.slug }}
                    className='text-muted-foreground hover:text-foreground text-xs'
                    title='在前台查看'
                  >
                    查看 →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to='/'
        className='text-muted-foreground hover:text-foreground mt-8 inline-block text-sm'
      >
        ← 返回首页
      </Link>
    </div>
  );
}
