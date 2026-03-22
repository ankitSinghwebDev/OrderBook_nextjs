// API base URL — always use relative '/api' for browser requests.
// This ensures fetch calls go to the same host/port the page is served from,
// regardless of which port the dev server runs on or where the app is deployed.
//
// NEXT_PUBLIC_API_URL is ONLY needed if the API is on a completely different domain
// (e.g., a separate backend server). For same-origin Next.js API routes, leave it unset.
const envBase = process.env.NEXT_PUBLIC_API_URL || '';

// Force relative path for same-origin: strip any localhost/127.0.0.1 absolute URLs
// that developers might accidentally set in .env
function resolveBase(raw) {
  if (!raw) return '/api';
  const trimmed = raw.replace(/\/+$/, '');
  // If it's already a relative path like '/api', use as-is
  if (trimmed.startsWith('/')) return trimmed;
  // If it points to localhost/127.0.0.1, convert to relative (these break in production)
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return url.pathname.replace(/\/+$/, '') || '/api';
    }
  } catch {
    // not a valid URL, use as-is
  }
  return trimmed;
}

export const API_BASE = resolveBase(envBase);

const joinUrl = (path) => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
};

export const apiFetch = (path, options = {}) =>
  fetch(joinUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
