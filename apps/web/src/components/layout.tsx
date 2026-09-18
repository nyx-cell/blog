import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Footer } from './footer.js';
import { Header } from './header.js';

type AppLayoutProps = {
  children: ReactNode;
};

/**
 * App shell. The header sits OUTSIDE the scroll container (`main`), so page
 * overscroll only rubber-bands the content. Window doesn't scroll; route
 * scroll reset/restore for `main` is handled by TanStack via
 * `scrollToTopSelectors: ['main']` in router.tsx.
 */
export function AppLayout({ children }: AppLayoutProps) {
  // Observable hydration marker: e2e waits on html[data-hydrated] so clicks
  // never race React before handlers are attached (same idea as the editor's
  // useHydrated gate).
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);

  return (
    <div className='relative z-[1] flex h-dvh flex-col'>
      <Header />
      <main className='min-h-0 flex-1 overflow-y-auto bg-transparent'>
        <div className='flex min-h-full flex-col'>
          <div className='flex-grow'>{children}</div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
