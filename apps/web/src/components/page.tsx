import type { ReactNode } from 'react';

/**
 * The single content container for every terminal-skin page. Owns the page
 * width decision (max-w) and the responsive gutters — pages never set their
 * own width. `className` lets a page add a typography scope without wrapping
 * in another container. The 640–1100px band widens the gutter so the column
 * reads as centered before the 880px max-width binds.
 */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        className
          ? `mx-auto w-full max-w-220 px-5.5 pt-6.5 pb-11.5 min-[640px]:max-[1100px]:px-11 ${className}`
          : 'mx-auto w-full max-w-220 px-5.5 pt-6.5 pb-11.5 min-[640px]:max-[1100px]:px-11'
      }
    >
      {children}
    </div>
  );
}
