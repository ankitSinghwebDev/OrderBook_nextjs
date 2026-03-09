'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const titleMap = {
  workspace: 'Workspace',
  'purchase-orders': 'Purchase Orders',
  new: 'New',
  'create-new-po': 'Create New PO',
  approvals: 'Approvals',
  suppliers: 'Suppliers',
  addresses: 'Delivery Addresses',
  bot: 'Bot',
  login: 'Login',
  signup: 'Signup',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Hide breadcrumbs on landing page
  if (segments.length === 0) return null;

  let items;

  // Special cases for friendly hierarchy
  if (pathname.startsWith('/create-new-po')) {
    items = [
      { name: 'Workspace', href: '/workspace', isLast: false },
      { name: 'Create New PO', href: '/create-new-po', isLast: true },
    ];
  } else if (pathname === '/purchase-orders/new') {
    items = [
      { name: 'Purchase Orders', href: '/purchase-orders', isLast: false },
      { name: 'New', href: '/purchase-orders/new', isLast: true },
    ];
  } else if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname.startsWith('/reset-password')) {
    items = [
      { name: 'Home', href: '/home', isLast: false },
      { name: titleMap[segments[0]] || segments[0], href: pathname, isLast: true },
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
    <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={item.href} className="flex items-center gap-2">
          {idx > 0 && <span className="text-slate-400">/</span>}
          {item.isLast ? (
            <span className="font-semibold text-slate-900">{item.name}</span>
          ) : (
            <Link href={item.href} className="hover:text-slate-900">
              {item.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
