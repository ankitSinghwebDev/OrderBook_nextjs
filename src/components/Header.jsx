'use client';
import Link from 'next/link';
import { memo, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeProvider';
import {
  MoonFilled, SunFilled, UserOutlined, SettingOutlined,
  LogoutOutlined, BgColorsOutlined, DownOutlined,
} from '@ant-design/icons';
import NotificationBell from './NotificationBell';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/purchase-orders', label: 'POs' },
  { href: '/purchase-orders/approvals', label: 'Approvals' },
  { href: '/grn', label: 'GRN' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/addresses', label: 'Addresses' },
];

function Header() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { theme, toggleTheme, accent, setAccent, presets } = useTheme();

  const userMenuRef = useRef(null);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    const authed = window.localStorage.getItem('isAuthed') === 'true';
    setIsAuthed(authed);
    if (authed) {
      setUserName(window.localStorage.getItem('userName') || '');
      setUserEmail(window.localStorage.getItem('userEmail') || '');
      setUserRole(window.localStorage.getItem('userRole') || '');
    }
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) setThemeMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    ['isAuthed', 'userId', 'userEmail', 'userName', 'workspaceId', 'userRole', 'joinCode']
      .forEach((k) => window.localStorage.removeItem(k));
    window.location.href = '/';
  };

  const isActive = (href) => {
    if (href === '/purchase-orders/approvals') return pathname === '/purchase-orders/approvals';
    if (href === '/purchase-orders') return pathname?.startsWith('/purchase-orders') && !pathname?.startsWith('/purchase-orders/approvals');
    return pathname?.startsWith(href);
  };

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-2.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={isAuthed ? '/dashboard' : '/'} className="text-xl font-bold shrink-0" style={{ color: 'var(--foreground)' }}>
          OrderBook
        </Link>

        {/* Nav Links — center */}
        {isAuthed && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} prefetch={true}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${active ? 'font-semibold' : 'hover:opacity-80'}`}
                  style={{ color: active ? 'var(--accent)' : 'var(--foreground)', backgroundColor: active ? 'var(--accent-softer)' : 'transparent' }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications */}
          {isAuthed && <NotificationBell />}

          {/* Theme Popover */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => { setThemeMenuOpen((v) => !v); setUserMenuOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <BgColorsOutlined />
              <span className="hidden sm:inline">Theme</span>
            </button>

            {themeMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border p-4 shadow-xl z-50"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Appearance</span>
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    {theme === 'dark' ? <MoonFilled /> : <SunFilled />}
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Accent Color</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {presets.map((swatch) => (
                    <button key={swatch} type="button" onClick={() => setAccent(swatch)}
                      className={`h-7 w-7 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${accent === swatch ? 'ring-2 ring-offset-2 scale-110' : ''}`}
                      style={{ backgroundColor: swatch, borderColor: accent === swatch ? swatch : 'var(--border)', '--tw-ring-color': swatch }}
                    />
                  ))}
                  <label
                    className="h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden flex items-center justify-center"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                    title="Custom color"
                  >
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>+</span>
                    <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="absolute opacity-0 w-0 h-0" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Auth buttons */}
          {!isAuthed && (
            <>
              <Link href="/signup" prefetch={true} className="text-sm font-medium px-3 py-1.5 rounded-md" style={{ color: 'var(--foreground)' }}>Sign up</Link>
              <Link href="/login" prefetch={true} className="text-sm font-medium px-3 py-1.5 rounded-md text-white" style={{ backgroundColor: 'var(--accent)' }}>Login</Link>
            </>
          )}

          {/* User Menu */}
          {isAuthed && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => { setUserMenuOpen((v) => !v); setThemeMenuOpen(false); }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 border transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
              >
                {/* Avatar */}
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-sm font-medium truncate max-w-[120px]" style={{ color: 'var(--foreground)' }}>
                    {userName || 'User'}
                  </div>
                  <div className="text-[10px] capitalize" style={{ color: 'var(--muted)' }}>
                    {userRole || 'member'}
                  </div>
                </div>
                <DownOutlined className="text-[10px]" style={{ color: 'var(--muted)' }} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-xl z-50 overflow-hidden"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: accent }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                          {userName || 'User'}
                        </div>
                        <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                          {userEmail || ''}
                        </div>
                        <div className="text-[10px] font-medium capitalize mt-0.5 inline-block rounded px-1.5 py-0.5"
                          style={{ backgroundColor: 'var(--accent-softer)', color: 'var(--accent)' }}
                        >
                          {userRole || 'member'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/workspace"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <SettingOutlined style={{ color: 'var(--muted)' }} />
                      Workspace Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors hover:opacity-80"
                      style={{ color: '#ff4d4f' }}
                    >
                      <LogoutOutlined />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
