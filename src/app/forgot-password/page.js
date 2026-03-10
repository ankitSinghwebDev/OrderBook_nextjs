'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    setStatus({ state: 'loading', message: '' });
    try {
      const data = await api.forgotPassword(payload);
      setStatus({ state: 'success', message: data?.message || 'If an account exists, we sent an email.' });
      event.currentTarget?.reset?.();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold text-indigo-700">
            Forgot password
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your account email and we’ll send a reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="you@company.com"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              {status.state === 'loading' ? 'Sending...' : 'Send reset link'}
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
            Remembered your password?{' '}
            <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
