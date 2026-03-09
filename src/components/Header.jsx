 'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeProvider';
import { MoonFilled, SunFilled } from '@ant-design/icons';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const { theme, toggleTheme, accent, setAccent, presets } = useTheme();

  useEffect(() => {
    const flag = window.localStorage.getItem('isAuthed');
    setIsAuthed(flag === 'true');
  }, [pathname]);

  const handleLogout = async () => {
    const ok = window.confirm('Are you sure you want to log out?');
    if (!ok) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    window.localStorage.removeItem('isAuthed');
    router.push('/');
  };

  return (
    <header
      className="w-full border-b backdrop-blur-sm transition-colors"
      style={{ backgroundColor: "color-mix(in srgb, var(--card) 85%, transparent)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Purchase Order
        </Link>

        <nav className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm shadow-sm transition-colors"
            style={{ border: `1px solid var(--border)`, backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)" }}
          >
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-full px-3 py-1 font-medium shadow-sm transition-colors"
              type="button"
              aria-label="Toggle light or dark mode"
              style={{ border: `1px solid var(--border)`, backgroundColor: "var(--card)", color: "var(--foreground)" }}
            >
              {theme === 'dark' ? <MoonFilled /> : <SunFilled />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
            <div className="flex items-center gap-2">
              {presets.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setAccent(swatch)}
                  className={`h-6 w-6 rounded-full border shadow-sm ${accent === swatch ? 'ring-2 ring-offset-2 ring-[var(--accent)]' : ''}`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Use accent ${swatch}`}
                />
              ))}
              <label
                className="h-6 w-6 overflow-hidden rounded-full border"
                style={{ borderColor: "var(--border)" }}
                aria-label="Pick custom accent color"
              >
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-8 w-8 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          {!isAuthed && (
            <>
              <Link
                href="/signup"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                Login
              </Link>
            </>
          )}

          {isAuthed && (
            <>
              <Link
                href="/workspace"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                Workspace
              </Link>
              <Link
                href="/create-new-po"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                New PO
              </Link>
              <Link
                href="/bot"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                Bot
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
