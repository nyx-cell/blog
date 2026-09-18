import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '../components/home.js';
import { getBlogListServerFn } from '../lib/blog-service.js';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: "Home | PerfectPan's Blog" }],
  }),
  loader: async () => {
    // Guest-visible first page powers the home "latest posts" panel (same
    // query the blog list runs; at most once per request).
    const data = await getBlogListServerFn({ data: { page: 1 } });
    return { posts: data.posts, total: data.total };
  },
  component: HomeRoute,
});

function HomeRoute() {
  const { posts, total } = Route.useLoaderData();
  return <HomePage posts={posts} total={total} />;
}
