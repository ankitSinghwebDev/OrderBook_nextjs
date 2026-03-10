// Resolve base once so both fetch wrapper and RTK Query share it.
// Priority: explicit NEXT_PUBLIC_API_URL -> NEXT_PUBLIC_APP_URL + /api -> same-origin /api
const rawBase =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : '/api');

// Normalize to avoid trailing slash issues when joining paths
export const API_BASE = rawBase.replace(/\/+$/, '');

const joinUrl = (path) => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
};

// Wrapper to keep all client-side API calls consistent with the configured base.
// Always sends credentials to support cookie-based auth.
export const apiFetch = (path, options = {}) =>
  fetch(joinUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
