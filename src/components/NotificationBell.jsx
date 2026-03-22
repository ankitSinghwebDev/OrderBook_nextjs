'use client';

import { useEffect, useRef, useState } from 'react';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.listNotifications({ limit: 15 });
      setNotifications(res?.data || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.markNotificationsRead({ markAll: true });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleClick = (notif) => {
    if (!notif.isRead) {
      api.markNotificationsRead({ ids: [notif._id] }).catch(() => {});
      setNotifications((prev) => prev.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) window.location.href = notif.link;
    setOpen(false);
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 border transition-colors"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <BellOutlined style={{ fontSize: 16 }} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: '#ff4d4f' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto rounded-xl border shadow-xl z-50"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b z-10" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <CheckOutlined /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className="w-full text-left px-4 py-3 border-b transition-colors hover:opacity-80"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: n.isRead ? 'transparent' : 'var(--accent-softer)',
                }}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{n.title}</div>
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{n.message}</div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
