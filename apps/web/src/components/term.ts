/**
 * Terminal-chrome class strings shared across shell components. Structure
 * colors come from the shadcn semantic tokens; decorative accents (cyan,
 * green) stay as literal per-theme hexes, same as the titlebar dots.
 */

// Title-bar tool button (login / grep / github / rss / theme / ⋯).
// Buttons inherit the mono font from v4 preflight. The 480px breakpoint
// collapses the tools into the ⋯ sheet (padding only — visibility is
// max-[480px]:hidden on the buttons themselves).
export const TOOL_BTN =
  'inline-flex h-6 shrink-0 cursor-pointer items-center justify-center gap-1 rounded bg-transparent px-2 text-sm leading-none text-muted-foreground hover:text-primary hover:no-underline max-[480px]:px-[5px]';

// Sheet row inside the ⋯ menu (≤480px only).
export const SHEET_ROW =
  'flex cursor-pointer items-center gap-2 bg-transparent px-2.5 py-[9px] text-left text-sm text-muted-foreground hover:text-primary hover:no-underline';
