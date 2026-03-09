'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'po-theme';
const ACCENT_KEY = 'po-accent';
const DEFAULT_ACCENT = '#4f46e5';

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace('#', '');
  if (![3, 6].includes(normalized.length)) return `rgba(99, 102, 241, ${alpha})`;
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [accent, setAccent] = useState(DEFAULT_ACCENT);

  // Load saved prefs or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    const storedAccent = localStorage.getItem(ACCENT_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    setTheme(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : (prefersDark ? 'dark' : 'light'));
    if (storedAccent) setAccent(storedAccent);
  }, []);

  // Apply to DOM + persist
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-strong', hexToRgba(accent, 0.65));
    root.style.setProperty('--accent-soft', hexToRgba(accent, 0.16));
    root.style.setProperty('--accent-softer', hexToRgba(accent, 0.08));
    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [theme, accent]);

  const value = useMemo(
    () => ({
      theme,
      accent,
      setAccent,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
      presets: ['#4f46e5', '#0ea5e9', '#22c55e', '#f97316', '#ec4899', '#8b5cf6'],
    }),
    [theme, accent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
