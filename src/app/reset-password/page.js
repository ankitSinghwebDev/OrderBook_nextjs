'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    setStatus({ state: 'loading', message: '' });
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: payload.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Reset failed');
      setStatus({ state: 'success', message: 'Password updated. You can log in now.' });
      setTimeout(() => router.push('/login'), 600);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold text-indigo-700">
            Reset password
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter a strong password. The link expires in 15 minutes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              {status.state === 'loading' ? 'Updating...' : 'Update password'}
            </button>
            {status.message && (
              <p
                className={`text-center text-sm ${
                  status.state === 'error' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {status.message}
              </p>
            )}
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Back to{' '}
            <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading reset form…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
