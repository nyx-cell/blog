import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, useTransition } from 'react';
import { authClient } from '../lib/auth-client.js';
import { Page } from './page.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (sessionData?.user?.id) {
      navigate({ to: '/blog', replace: true });
    }
  }, [navigate, sessionData?.user?.id]);

  if (sessionData?.user?.id || isSessionPending) {
    return (
      <Page className='text-sm'>
        <p className='text-muted-foreground/60'># checking session…</p>
      </Page>
    );
  }

  return (
    <Page className='text-sm'>
      <div className='flex flex-wrap items-baseline gap-2.5'>
        <span className='text-chart-1'>guest</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>perfectpan.org</span>{' '}
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          ssh member@perfectpan.org
        </span>
      </div>
      <p className='mb-1 text-muted-foreground/60 mt-2'>
        # 邮箱密码登录；或者走 GitHub OAuth。
      </p>
      <form
        className='mt-4'
        method='post'
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await authClient.signIn.email({
              email,
              password,
              callbackURL: '/blog',
            });

            if (result.error) {
              setError(result.error.message ?? '登录失败');
              return;
            }

            navigate({ to: '/blog' });
          });
        }}
      >
        <div className='my-3.5 max-w-105 [&_label]:mb-1.25 [&_label]:block [&_label]:text-xs [&_label]:text-muted-foreground'>
          <label htmlFor='email'>
            <span className='text-primary'>▸ </span>email
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            autoComplete='email'
            className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className='my-3.5 max-w-105 [&_label]:mb-1.25 [&_label]:block [&_label]:text-xs [&_label]:text-muted-foreground'>
          <label htmlFor='password'>
            <span className='text-primary'>▸ </span>password
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='current-password'
            className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className='mt-5 flex flex-wrap gap-3'>
          <button
            type='submit'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
            disabled={isPending}
          >
            {isPending ? 'signing in…' : 'sign in'}
          </button>
          <button
            type='button'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary'
            onClick={async () => {
              setError(null);
              const result = await authClient.signIn.social({
                provider: 'github',
                callbackURL: '/blog',
              });
              if (result.error) {
                setError(result.error.message ?? 'GitHub 登录失败');
              }
            }}
          >
            continue with github
          </button>
        </div>
        {error ? (
          <p role='alert' className='my-2.5 text-sm text-destructive'>
            {error}
          </p>
        ) : null}
      </form>
      <p className='mb-1 mt-4'>
        <span className='text-muted-foreground/60'># 还没有账号？</span>{' '}
        <Link
          to='/signup'
          className='text-muted-foreground hover:text-foreground'
        >
          signup
        </Link>
      </p>
    </Page>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (sessionData?.user?.id) {
      navigate({ to: '/blog', replace: true });
    }
  }, [navigate, sessionData?.user?.id]);

  if (sessionData?.user?.id || isSessionPending) {
    return (
      <Page className='text-sm'>
        <p className='text-muted-foreground/60'># checking session…</p>
      </Page>
    );
  }

  return (
    <Page className='text-sm'>
      <div className='flex flex-wrap items-baseline gap-2.5'>
        <span className='text-chart-1'>guest</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>perfectpan.org</span>{' '}
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          useradd --join
        </span>
      </div>
      <p className='mb-1 text-muted-foreground/60 mt-2'>
        # 注册成为 member，可读 member 可见性的文章。
      </p>
      <form
        className='mt-4'
        method='post'
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await authClient.signUp.email({
              email,
              password,
              name,
              callbackURL: '/blog',
            });

            if (result.error) {
              setError(result.error.message ?? '注册失败');
              return;
            }

            navigate({ to: '/blog' });
          });
        }}
      >
        <div className='my-3.5 max-w-105 [&_label]:mb-1.25 [&_label]:block [&_label]:text-xs [&_label]:text-muted-foreground'>
          <label htmlFor='name'>
            <span className='text-primary'>▸ </span>name
          </label>
          <input
            id='name'
            name='name'
            type='text'
            required
            autoComplete='name'
            className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className='my-3.5 max-w-105 [&_label]:mb-1.25 [&_label]:block [&_label]:text-xs [&_label]:text-muted-foreground'>
          <label htmlFor='email'>
            <span className='text-primary'>▸ </span>email
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            autoComplete='email'
            className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className='my-3.5 max-w-105 [&_label]:mb-1.25 [&_label]:block [&_label]:text-xs [&_label]:text-muted-foreground'>
          <label htmlFor='password'>
            <span className='text-primary'>▸ </span>password
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='new-password'
            className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className='mt-5 flex flex-wrap gap-3'>
          <button
            type='submit'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
            disabled={isPending}
          >
            {isPending ? 'creating…' : 'create account'}
          </button>
          <button
            type='button'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary'
            onClick={async () => {
              setError(null);
              const result = await authClient.signIn.social({
                provider: 'github',
                callbackURL: '/blog',
              });
              if (result.error) {
                setError(result.error.message ?? 'GitHub 注册失败');
              }
            }}
          >
            continue with github
          </button>
        </div>
        {error ? (
          <p role='alert' className='my-2.5 text-sm text-destructive'>
            {error}
          </p>
        ) : null}
      </form>
    </Page>
  );
}

export function UnlockPage({
  slug,
  search,
}: {
  slug: string;
  search?: Record<string, string | undefined>;
}) {
  const { error: searchError } = (search ?? {}) as { error?: string };
  const errorLabel =
    searchError === 'missing'
      ? '请输入访问密码'
      : searchError === 'invalid'
        ? '密码错误，请重试'
        : undefined;

  return (
    <Page className='text-sm'>
      <div className='flex flex-wrap items-baseline gap-2.5'>
        <span className='text-chart-1'>guest</span>
        <span className='text-muted-foreground/60'>@</span>
        <span className='text-chart-2'>perfectpan.org</span>{' '}
        <span className='text-primary'>~ %</span>{' '}
        <span className='text-foreground hover:text-primary'>
          cat posts/{slug}.md
        </span>
      </div>
      <p className='mb-1'>
        <span className='text-destructive'>
          cat: posts/{slug}.md: Permission denied
        </span>
      </p>
      <p className='mb-1 text-muted-foreground/60'>
        # 这篇文章是密码保护的。输入单文密码后 24 小时内免密阅读。
      </p>
      <form method='post' className='mt-4'>
        <div className='my-3.5 max-w-105 [&_label]:mb-1.25 [&_label]:block [&_label]:text-xs [&_label]:text-muted-foreground'>
          <label htmlFor='password'>
            <span className='text-primary'>▸ </span>password for this post
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            className='w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_15%,transparent)]'
          />
        </div>
        <div className='mt-5 flex flex-wrap items-center gap-3'>
          <button
            type='submit'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
          >
            sudo unlock
          </button>
          <Link
            to='/blog/$slug'
            params={{ slug }}
            className='text-muted-foreground hover:text-foreground'
          >
            ← 返回文章
          </Link>
        </div>
        {errorLabel ? (
          <p role='alert' className='my-2.5 text-sm text-destructive'>
            {errorLabel}
          </p>
        ) : null}
      </form>
    </Page>
  );
}
