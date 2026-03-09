'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, message } from 'antd';
import { CloseCircleFilled, MoonFilled, SunFilled } from '@ant-design/icons';
import { setUser } from '@/store/userSlice';
import { useLoginMutation, useCreateWorkspaceMutation } from '@/store/apiSlice';
import { getApiErrorMessage } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeProvider';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const [createWorkspace] = useCreateWorkspaceMutation();
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { theme, toggleTheme, accent } = useTheme();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setStatus({ state: 'loading', message: '' });

    try {
      const data = await login(payload).unwrap();

      // If user has no workspace yet, create one on first login
      let enrichedUser = data.user;
      let joinCode;
      if (!data?.user?.workspaceId) {
        try {
          const wsName =
            data?.user?.companyName?.trim() ||
            data?.user?.name?.trim() ||
            'Workspace';
          const ws = await createWorkspace({
            name: wsName,
            ownerUserId: data?.user?._id,
          }).unwrap();
          enrichedUser = {
            ...data.user,
            workspaceId: ws?.workspace?.workspaceId,
            isCreator: true,
            role: 'admin',
          };
          joinCode = ws?.joinCode;
          window.localStorage.setItem(
            'workspaceId',
            ws?.workspace?.workspaceId || ''
          );
          window.localStorage.setItem('joinCode', joinCode || '');
        } catch (err) {
          console.error('Auto create workspace failed', err);
          messageApi.warning(
            'Signed in, but workspace was not created automatically. Create one from settings.'
          );
        }
      }

      window.localStorage.setItem('isAuthed', 'true');
      window.localStorage.setItem('userId', enrichedUser?._id || '');
      window.localStorage.setItem('userEmail', enrichedUser?.email || '');
      window.localStorage.setItem('userName', enrichedUser?.name || '');
      if (enrichedUser?.workspaceId) {
        window.localStorage.setItem('workspaceId', enrichedUser.workspaceId);
      }
      dispatch(setUser({ user: enrichedUser, token: data.token }));
      setStatus({ state: 'success', message: 'Welcome back!' });
      router.replace('/workspace');
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to login.');
      setStatus({ state: 'error', message: errorMessage });
      messageApi.open({
        type: 'error',
        content: errorMessage,
        icon: <CloseCircleFilled />,
      });
    }
  };

  return (
    <div
      className="min-h-screen py-12 transition-colors"
      style={{
        color: 'var(--foreground)',
        background:
          'radial-gradient(circle at 20% 20%, var(--accent-softer), transparent 32%), radial-gradient(circle at 80% 10%, var(--accent-softer), transparent 35%), radial-gradient(circle at 50% 100%, var(--accent-softer), transparent 40%), var(--background)',
      }}
    >
      {contextHolder}
      <div className="mx-auto max-w-lg px-6 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <p
              className="inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold shadow-sm"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 15%, var(--card))',
              }}
            >
              Welcome back
            </p>
            <h1 className="mt-4 text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Log in
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Access your purchase order workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition-colors"
            style={{ border: `1px solid var(--border)`, backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          >
            {theme === 'dark' ? <MoonFilled /> : <SunFilled />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>

        <div
          className="rounded-2xl border p-6 shadow-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)',
                  color: 'var(--foreground)',
                }}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)',
                  color: 'var(--foreground)',
                }}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <input
                type="checkbox"
                id="login-show-password"
                className="h-4 w-4"
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="login-show-password">Show password</label>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold transition-transform"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              {status.state === 'loading' ? 'Signing in...' : 'Log in'}
            </button>
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm font-semibold transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                Forgot password?
              </a>
            </div>
            {status.message && (
              <Alert
                showIcon
                type={status.state === 'error' ? 'error' : 'success'}
                message={status.message}
              />
            )}
          </form>
          <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
            New here?{' '}
            <a
              href="/signup"
              className="font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Create an account
            </a>
          </p>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
          Pick an accent in the header. Current accent: <span style={{ color: accent }}>{accent}</span>
        </p>
      </div>
    </div>
  );
}
