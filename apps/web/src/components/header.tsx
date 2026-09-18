import { Link, useNavigate } from '@tanstack/react-router';
import {
  Github,
  LogOut,
  MoreHorizontal,
  Rss,
  Search,
  UserRound,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { authClient } from '../lib/auth-client.js';
import { ConfirmDialog } from './confirm-dialog.js';
import { DarkMode } from './dark-mode.js';
import { searchPalette } from './search-palette-store.js';
import { SHEET_ROW, TOOL_BTN } from './term.js';

function getRoleLabel(role?: string | null): string {
  if (role === 'admin') {
    return 'ADMIN';
  }

  if (role === 'vip') {
    return 'VIP';
  }

  return 'MEMBER';
}

// Tools collapse behind the ⋯ toggle on ≤480px; the user chip, theme toggle
// and the ⋯ itself stay visible.
const TOOL_VIS = 'max-[480px]:hidden';

/** Terminal title bar: window dots + session name + right-aligned tools.
 *  ≤480px the tool buttons collapse behind a ⋯ toggle that expands a flat
 *  text sheet under the bar (no drawer, no animation — terminals don't slide). */
export function Header() {
  const { data: sessionData } = authClient.useSession();
  const sessionUser = sessionData?.user ?? null;
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!toolsOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setToolsOpen(false);
      }
    };
    // Tapping outside the bar closes the sheet — on touch there is no Esc,
    // so an outside tap is the natural dismissal gesture.
    const onPointerDown = (event: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [toolsOpen]);

  return (
    <header
      ref={barRef}
      className='relative flex items-center gap-2 border-b border-border bg-card px-4.5 py-2.5 max-[640px]:gap-1.25 max-[640px]:px-3 max-[640px]:py-2'
    >
      <span
        className='size-2.75 shrink-0 rounded-full bg-[#e5544b]'
        aria-hidden='true'
      />
      <span
        className='size-2.75 shrink-0 rounded-full bg-[#d8a03c]'
        aria-hidden='true'
      />
      <span
        className='size-2.75 shrink-0 rounded-full bg-[#47a258]'
        aria-hidden='true'
      />
      <span className='ml-2.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground max-[599px]:hidden max-[640px]:text-xs'>
        <Link to='/' className='text-inherit no-underline'>
          <b className='font-semibold text-foreground'>perfectpan@blog</b>
        </Link>
      </span>

      <div className='ml-auto flex items-center gap-1 max-[640px]:gap-0.5'>
        {sessionUser ? (
          <span
            className='inline-flex h-6 min-w-0 items-center gap-1.5 rounded border border-border bg-secondary px-2 text-xs leading-none'
            title={sessionUser.email}
          >
            <span className='block min-w-0 max-w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap text-chart-1'>
              {sessionUser.name || sessionUser.email}
            </span>
            <span className='shrink-0 rounded-full bg-primary px-1.75 py-px text-xs leading-normal font-bold text-primary-foreground'>
              {getRoleLabel(sessionUser.role)}
            </span>
          </span>
        ) : null}
        {sessionUser ? (
          <Link
            to='/logout'
            data-testid='nav-logout'
            aria-label='Logout'
            className={`${TOOL_BTN} ${TOOL_VIS}`}
            onClick={(event) => {
              event.preventDefault();
              setLogoutOpen(true);
            }}
          >
            <LogOut size={15} aria-hidden='true' />
            <span className='hidden md:inline'>logout</span>
          </Link>
        ) : (
          <>
            <Link
              to='/login'
              data-testid='nav-login'
              className={`${TOOL_BTN} ${TOOL_VIS}`}
            >
              <UserRound size={15} aria-hidden='true' />
              <span className='hidden md:inline'>login</span>
            </Link>
            <Link
              to='/signup'
              data-testid='nav-signup'
              className={`${TOOL_BTN} ${TOOL_VIS}`}
            >
              <UserRoundPlus size={15} aria-hidden='true' />
              <span className='hidden md:inline'>signup</span>
            </Link>
          </>
        )}
        <DarkMode />
        <button
          type='button'
          aria-label='Search posts (Cmd+K)'
          onClick={() => searchPalette.open()}
          className={`${TOOL_BTN} ${TOOL_VIS}`}
        >
          <Search size={15} aria-hidden='true' />
          <span className='hidden md:inline'>grep</span>
        </button>
        <a
          href='https://github.com/PerfectPan'
          target='_blank'
          rel='noreferrer'
          aria-label='GitHub'
          className={`${TOOL_BTN} ${TOOL_VIS}`}
        >
          <Github size={15} aria-hidden='true' />
          <span className='hidden md:inline'>github</span>
        </a>
        <a
          href='/rss.xml'
          target='_blank'
          rel='noreferrer'
          aria-label='RSS'
          className={`${TOOL_BTN} ${TOOL_VIS}`}
        >
          <Rss size={15} aria-hidden='true' />
          <span className='hidden md:inline'>rss</span>
        </a>
        <button
          type='button'
          className={`${TOOL_BTN} hidden max-[480px]:inline-flex`}
          aria-label={toolsOpen ? 'Close tools menu' : 'Open tools menu'}
          aria-expanded={toolsOpen}
          onClick={() => {
            setToolsOpen(!toolsOpen);
          }}
        >
          {toolsOpen ? (
            <X size={15} aria-hidden='true' />
          ) : (
            <MoreHorizontal size={15} aria-hidden='true' />
          )}
        </button>
      </div>
      {toolsOpen ? (
        // Flat text sheet under the bar; every item closes it as its action
        // (the window-level Escape listener covers Esc as well).
        <div className='absolute inset-x-0 top-full z-40 hidden flex-col border-b border-border bg-secondary px-3 pt-1 pb-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)] max-[480px]:flex'>
          {sessionUser ? (
            <button
              type='button'
              onClick={() => {
                setToolsOpen(false);
                setLogoutOpen(true);
              }}
              className={SHEET_ROW}
            >
              <LogOut size={14} aria-hidden='true' /> logout
            </button>
          ) : (
            <>
              <Link
                to='/login'
                onClick={() => {
                  setToolsOpen(false);
                }}
                className={SHEET_ROW}
              >
                <UserRound size={14} aria-hidden='true' /> login
              </Link>
              <Link
                to='/signup'
                onClick={() => {
                  setToolsOpen(false);
                }}
                className={SHEET_ROW}
              >
                <UserRoundPlus size={14} aria-hidden='true' /> signup
              </Link>
            </>
          )}
          <button
            type='button'
            onClick={() => {
              setToolsOpen(false);
              searchPalette.open();
            }}
            className={SHEET_ROW}
          >
            <Search size={14} aria-hidden='true' /> grep
          </button>
          <a
            href='https://github.com/PerfectPan'
            target='_blank'
            rel='noreferrer'
            onClick={() => {
              setToolsOpen(false);
            }}
            className={SHEET_ROW}
          >
            <Github size={14} aria-hidden='true' /> github
          </a>
          <a
            href='/rss.xml'
            target='_blank'
            rel='noreferrer'
            onClick={() => {
              setToolsOpen(false);
            }}
            className={SHEET_ROW}
          >
            <Rss size={14} aria-hidden='true' /> rss
          </a>
        </div>
      ) : null}
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        command='logout'
        description='确定要退出登录吗？退出后需要重新登录。'
        confirmLabel='logout'
        onConfirm={() => {
          setLogoutOpen(false);
          navigate({ to: '/logout' });
        }}
      />
    </header>
  );
}
