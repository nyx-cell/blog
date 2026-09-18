import type { CommentThread, SessionUser } from '@blog/shared';
import { Link } from '@tanstack/react-router';
import { Comments } from './comments.js';
import { Markdown } from './markdown.js';
import { Page } from './page.js';

type ArticlePageProps = {
  post: {
    slug: string;
    title: string;
    contentMdx: string;
    publishedAt: string;
    visibility: string;
    tags: string[];
  };
  comments: CommentThread[];
  hasMoreComments: boolean;
  totalComments: number;
  sessionUser: SessionUser | null;
};

export function ArticlePage({
  post,
  comments,
  hasMoreComments,
  totalComments,
  sessionUser,
}: ArticlePageProps) {
  const date = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Page>
      <div className='flex flex-wrap items-baseline gap-2.5'>
        <span className='text-chart-1'>perfectpan</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>blog</span>{' '}
        <span className='text-primary'>~/posts %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          cat {new Date(post.publishedAt).getFullYear()}/{post.slug}.md
        </span>
      </div>

      <div className='mt-4 mb-6.5'>
        <h1 className='text-3xl leading-snug font-bold text-foreground'>
          {post.title}
        </h1>
        <div className='mt-1.5 flex flex-wrap gap-4 text-sm text-muted-foreground'>
          <span>{date}</span>
          <span>·</span>
          <span>{post.visibility}</span>
          {post.tags.length > 0 ? (
            <>
              <span>·</span>
              <span>#{post.tags.join(' #')}</span>
            </>
          ) : null}
        </div>
      </div>
      <Markdown content={post.contentMdx} />
      <div className='flex flex-wrap items-baseline gap-2.5 mt-6'>
        <span className='text-chart-1'>perfectpan</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>blog</span>{' '}
        <span className='text-primary'>~/posts %</span>{' '}
        <Link
          to='/blog'
          activeOptions={{ exact: true }}
          className='text-foreground hover:text-primary text-muted-foreground hover:text-foreground'
        >
          cd ..
        </Link>
      </div>
      <Comments
        key={post.slug}
        slug={post.slug}
        initialComments={comments}
        initialHasMore={hasMoreComments}
        initialTotal={totalComments}
        sessionUser={sessionUser}
      />
    </Page>
  );
}
