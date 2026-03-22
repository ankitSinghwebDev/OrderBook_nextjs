'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const titleMap = {
  dashboard: 'Dashboard',
  workspace: 'Workspace',
  'purchase-orders': 'Purchase Orders',
  new: 'New',
  edit: 'Edit',
  approvals: 'Approvals',
  suppliers: 'Suppliers',
  addresses: 'Delivery Addresses',
  grn: 'Goods Received Notes',
  'supplier-portal': 'Supplier Portal',
  bot: 'Bot',
  login: 'Login',
  signup: 'Signup',
  'create-new-po': 'Create New PO',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || pathname === '/home') return null;

  let items;

  if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname.startsWith('/reset-password')) {
    items = [
      { name: 'Home', href: '/home', isLast: false },
      { name: titleMap[segments[0]] || segments[0], href: pathname, isLast: true },
    ];
  } else if (pathname.startsWith('/create-new-po')) {
    items = [
      { name: 'Purchase Orders', href: '/purchase-orders', isLast: false },
      { name: 'New', href: '/purchase-orders/new', isLast: true },
    ];
  } else if (pathname.match(/^\/purchase-orders\/[a-f0-9]{24}\/edit$/)) {
    items = [
      { name: 'Purchase Orders', href: '/purchase-orders', isLast: false },
      { name: 'Detail', href: `/purchase-orders/${segments[1]}`, isLast: false },
      { name: 'Edit', href: pathname, isLast: true },
    ];
  } else if (pathname.match(/^\/purchase-orders\/[a-f0-9]{24}$/)) {
    items = [
      { name: 'Purchase Orders', href: '/purchase-orders', isLast: false },
      { name: 'Detail', href: pathname, isLast: true },
    ];
  } else {
    items = segments.map((seg, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      return {
        name: titleMap[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        href,
        isLast: idx === segments.length - 1,
      };
    });
  }

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }} aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={item.href} className="flex items-center gap-2">
          {idx > 0 && <span style={{ color: 'var(--border)' }}>/</span>}
          {item.isLast ? (
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</span>
          ) : (
            <Link href={item.href} className="hover:underline" style={{ color: 'var(--muted)' }}>
              {item.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
