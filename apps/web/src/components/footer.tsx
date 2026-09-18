import { Link } from '@tanstack/react-router';
import { authClient } from '../lib/auth-client.js';

/**
 * tmux-style status bar: session name + clickable windows on the left, site
 * info on the right. Doubles as secondary navigation. ≤560px drops the
 * right-hand credits; ≤430px drops the session badge and tightens the row to
 * stay single-line.
 */
const WIN =
  'rounded-sm px-2 py-px text-muted-foreground hover:text-foreground hover:no-underline max-[430px]:px-1.5';

export function Footer() {
  const { data: sessionData } = authClient.useSession();
  const isAdmin = sessionData?.user?.role === 'admin';

  return (
    <footer className='flex flex-wrap items-center gap-1 border-t border-border bg-muted px-3.5 py-1.5 text-xs max-[430px]:gap-0.5 max-[430px]:px-2.5 max-[430px]:text-xs'>
      <span className='mr-2 rounded-sm bg-chart-2 px-2 py-px font-bold text-chart-4 max-[430px]:mr-0 max-[430px]:hidden'>
        blog
      </span>
      <nav aria-label='站点窗口' className='flex flex-wrap items-center gap-1'>
        <Link to='/' className={WIN}>
          0:home
        </Link>
        <Link to='/blog' className={WIN}>
          1:posts
        </Link>
        <Link to='/projects' className={WIN}>
          2:projects
        </Link>
        <Link to='/about' className={WIN}>
          3:about
        </Link>
        {isAdmin ? (
          <Link to='/admin' className={WIN}>
            4:admin
          </Link>
        ) : null}
      </nav>
      <span className='ml-auto flex gap-3.5 text-muted-foreground/60 max-[560px]:hidden'>
        <span>perfectpan.org</span>
        <span>© {new Date().getFullYear()}</span>
      </span>
    </footer>
  );
}
