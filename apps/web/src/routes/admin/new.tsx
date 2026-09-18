import { createFileRoute, Link } from '@tanstack/react-router';
import { PostEditor } from '../../components/post-editor.js';
import {
  ensureAdminServerFn,
  listPostTagsServerFn,
} from '../../lib/admin-service.js';

export const Route = createFileRoute('/admin/new')({
  head: () => ({ meta: [{ title: 'Admin · 新建文章' }] }),
  loader: async () => {
    await ensureAdminServerFn();
    const { tags } = await listPostTagsServerFn();
    return { allTags: tags };
  },
  component: NewPostPage,
});

function NewPostPage() {
  const { allTags } = Route.useLoaderData();
  return (
    <div className='mx-auto w-full self-start max-w-5xl px-4 pt-8 pb-12 sm:px-6'>
      <div className='flex flex-wrap items-baseline gap-2.5 mb-2'>
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          vi /posts/draft.md
        </span>
      </div>
      <Link
        to='/admin'
        className='text-muted-foreground hover:text-foreground mb-4 inline-block text-sm'
      >
        ← 返回列表
      </Link>
      <h1 className='text-lg font-semibold text-foreground mb-6'>新建文章</h1>
      <PostEditor mode='new' allTags={allTags} />
    </div>
  );
}
