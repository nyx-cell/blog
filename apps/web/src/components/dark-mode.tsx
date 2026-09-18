'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { TOOL_BTN } from './term.js';

type ViewTransitionLike = {
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => ViewTransitionLike;
};

/** User intent, persisted in localStorage. Absent key = follow the system. */
type ThemePref = 'light' | 'dark' | 'system';

const THEME_KEY = 'blog-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const PREFS: ThemePref[] = ['light', 'dark', 'system'];

function readStoredPref(): ThemePref {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return PREFS.includes(raw as ThemePref) ? (raw as ThemePref) : 'system';
  } catch {
    return 'system';
  }
}

export function DarkMode() {
  // 'system' on the server AND on the first client render (hydration must
  // match); the mount effect syncs the stored pref + system media. Until that
  // sync lands, the class-sync effect is gated OFF: the boot script in
  // __root already painted the right palette, and re-asserting the not-yet-
  // synced default here would flash light for a frame.
  const [pref, setPref] = useState<ThemePref>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [synced, setSynced] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const isDarkMode = pref === 'dark' || (pref === 'system' && systemDark);

  useEffect(() => {
    setPref(readStoredPref());
    const media = window.matchMedia(DARK_QUERY);
    setSystemDark(media.matches);
    setSynced(true);
    const onMedia = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches);
    };
    media.addEventListener('change', onMedia);
    return () => media.removeEventListener('change', onMedia);
  }, []);

  useEffect(() => {
    if (!synced) {
      return;
    }
    // The terminal theme carries its own dark palette via html.dark custom
    // properties. Keep the browser-chrome theme-color meta in sync with the
    // surface color.
    document.documentElement.classList.toggle('dark', isDarkMode);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDarkMode ? '#0a0f14' : '#ffffff');
  }, [isDarkMode, synced]);

  const applyPref = useCallback((next: ThemePref) => {
    setPref(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage unavailable (private mode etc.) — choice lasts the session.
    }
  }, []);

  const onTrigger = () => {
    const next = PREFS[(PREFS.indexOf(pref) + 1) % PREFS.length];
    const doc = document as ViewTransitionDocument;

    if (
      !ref.current ||
      !doc.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      applyPref(next);
      return;
    }

    // Capture the anchor rect BEFORE starting the transition: once the
    // dark-mode class swap runs, scrollbar / reflow may shift layout and
    // move the measured origin off the icon.
    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    // Bake the measured origin into the keyframes as VIEWPORT PERCENTAGES.
    // Pixel values are wrong on some setups: Chromium interprets clip-path
    // lengths on view-transition pseudo-elements against the physical
    // (device-pixel) snapshot box, so CSS-pixel coordinates land at half
    // the intended position on DPR-2 screens (circle grew from top-center
    // instead of the icon). Percentages resolve against the pseudo's own
    // box in whatever space the engine uses, so they stay pinned to the
    // icon at any DPR / zoom / window size.
    const xp = (x / window.innerWidth) * 100;
    const yp = (y / window.innerHeight) * 100;
    // circle() percentage radius resolves against sqrt(w²+h²)/sqrt(2) of
    // the reference box — convert the pixel max radius into that space.
    const radiusRef =
      Math.hypot(window.innerWidth, window.innerHeight) / Math.SQRT2;
    const rp = (maxRadius / radiusRef) * 100;

    let styleEl = document.getElementById(
      'vt-dark-reveal-keyframes',
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'vt-dark-reveal-keyframes';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@keyframes dark-mode-reveal{from{clip-path:circle(0% at ${xp}% ${yp}%)}to{clip-path:circle(${rp}% at ${xp}% ${yp}%)}}`;
    document.documentElement.classList.add('vt-dark-reveal');

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        applyPref(next);
      });
    });
    transition.finished
      .catch(() => {})
      .finally(() =>
        document.documentElement.classList.remove('vt-dark-reveal'),
      );
  };

  const next = PREFS[(PREFS.indexOf(pref) + 1) % PREFS.length];

  return (
    <button
      type='button'
      ref={ref}
      aria-label={`Switch to ${next} mode (current: ${pref})`}
      className={TOOL_BTN}
      onClick={onTrigger}
    >
      {pref === 'light' ? (
        <Sun size={15} />
      ) : pref === 'dark' ? (
        <Moon size={15} />
      ) : (
        <Monitor size={15} />
      )}
      <span className='hidden md:inline'>{pref}</span>
    </button>
  );
}
