import { createFileRoute, Link } from '@tanstack/react-router';
import { Markdown } from '../components/markdown.js';
import { Page } from '../components/page.js';

/**
 * About copy. Single edit point — change the markdown here and push; no CMS,
 * no database rows behind this page.
 *
 * NOTE: content below is a first draft for the page launch — the site owner
 * should rewrite it in their own voice.
 */
const ABOUT_MD = `## 关于我

我是 **PerfectPan**，一个喜欢折腾的开发者。写代码，也写字 —— 这里记录我在工程、工具和日常折腾中踩过的坑与想明白的事。

- **开源**：维护一些小工具，比如 Logseq 插件、Rust 写的 CLI、agent 相关的小玩具，完整列表见 \`~/projects\`。
- **订阅**：通过 [RSS](/rss.xml) 关注更新，或到 [GitHub](https://github.com/PerfectPan) 找到我。
`;

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: "About | PerfectPan's Blog" },
      { name: 'description', content: '关于 PerfectPan 与这个博客' },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Page>
      <div className='flex flex-wrap items-baseline gap-2.5'>
        <span className='text-chart-1'>perfectpan</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>blog</span>{' '}
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          cat ~/about.md
        </span>
      </div>
      <Markdown content={ABOUT_MD} />
      <div className='flex flex-wrap items-baseline gap-2.5 mt-6'>
        <span className='text-chart-1'>perfectpan</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>blog</span>{' '}
        <span className='text-primary'>~ %</span>{' '}
        <Link
          to='/'
          className='text-foreground hover:text-primary text-muted-foreground hover:text-foreground'
        >
          cd ~
        </Link>
      </div>
    </Page>
  );
}
