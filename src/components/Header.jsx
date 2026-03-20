'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeProvider';
import { MoonFilled, SunFilled } from '@ant-design/icons';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/purchase-orders', label: 'Purchase Orders' },
  { href: '/purchase-orders/approvals', label: 'Approvals' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/addresses', label: 'Addresses' },
  { href: '/workspace', label: 'Workspace' },
];

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
    } catch { /* ignore */ }
    window.localStorage.removeItem('isAuthed');
    window.localStorage.removeItem('userId');
    window.localStorage.removeItem('userEmail');
    window.localStorage.removeItem('userName');
    window.localStorage.removeItem('workspaceId');
    window.localStorage.removeItem('userRole');
    window.localStorage.removeItem('joinCode');
    router.push('/');
  };

  return (
    <header
      className="w-full border-b backdrop-blur-sm transition-colors"
      style={{ backgroundColor: 'color-mix(in srgb, var(--card) 85%, transparent)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href={isAuthed ? '/dashboard' : '/'} className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          OrderBook
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm"
            style={{ border: `1px solid var(--border)`, backgroundColor: 'color-mix(in srgb, var(--card) 88%, transparent)' }}
          >
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs transition-colors"
              type="button"
              aria-label="Toggle theme"
              style={{ border: `1px solid var(--border)`, backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            >
              {theme === 'dark' ? <MoonFilled /> : <SunFilled />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
            <div className="flex items-center gap-1.5">
              {presets.map((swatch) => (
                <button
                  key={swatch} type="button"
                  onClick={() => setAccent(swatch)}
                  className={`h-5 w-5 rounded-full border shadow-sm ${accent === swatch ? 'ring-2 ring-offset-1 ring-[var(--accent)]' : ''}`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Use accent ${swatch}`}
                />
              ))}
              <label className="h-5 w-5 overflow-hidden rounded-full border" style={{ borderColor: 'var(--border)' }} aria-label="Pick custom accent">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-6 w-6 cursor-pointer opacity-0" />
              </label>
            </div>
          </div>

          {!isAuthed && (
            <>
              <Link href="/signup" className="text-sm font-medium transition-colors px-2 py-1" style={{ color: 'var(--foreground)' }}>Sign up</Link>
              <Link href="/login" className="text-sm font-medium transition-colors px-2 py-1" style={{ color: 'var(--foreground)' }}>Login</Link>
            </>
          )}

          {isAuthed && (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="text-sm font-medium transition-colors px-2 py-1 rounded-md"
                  style={{
                    color: pathname?.startsWith(item.href) ? 'var(--accent)' : 'var(--foreground)',
                    backgroundColor: pathname?.startsWith(item.href) ? 'var(--accent-softer)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
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
