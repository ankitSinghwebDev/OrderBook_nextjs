'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useJoinWorkspaceMutation } from '@/store/apiSlice';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '', joinCode: '' });
  const [joinWorkspace, { isLoading: joining }] = useJoinWorkspaceMutation();
  const [joinMessage, setJoinMessage] = useState('');
  const router = useRouter();

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinMessage('');
    try {
      const res = await joinWorkspace({
        name: form.name,
        email: form.email,
        role: form.role,
        joinCode: form.joinCode,
      }).unwrap();
      if (res?.user?._id) {
        window.localStorage.setItem('isAuthed', 'true');
        window.localStorage.setItem('userId', res.user._id || '');
        window.localStorage.setItem('userEmail', res.user.email || '');
        window.localStorage.setItem('userName', res.user.name || '');
        window.localStorage.setItem('workspaceId', res?.workspace?.workspaceId || '');
        router.replace('/workspace');
        return;
      }
      setJoinMessage(`Joined workspace ${res?.workspace?.name || ''}. You can now log in.`);
    } catch (err) {
      setJoinMessage(err?.data?.message || 'Failed to join workspace. Check the code and try again.');
    }
  };

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-8 py-14 text-white shadow-xl">
        <div className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl animate-orb" />
        <div className="pointer-events-none absolute -right-10  top-20 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl animate-orb-slow" />
        <div className="pointer-events-none absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-fuchsia-400/25 blur-3xl animate-spin-slow" />

        <div className="relative max-w-4xl space-y-6">
          <p className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-sm font-semibold backdrop-blur">
            New • Faster purchasing, happier finance
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Run purchasing on autopilot—request, approve, and track in minutes.
          </h1>
          <p className="text-lg sm:text-xl text-white/85">
            Purchase Order helps teams create, approve, and reconcile spend with built-in workflows, real-time tracking, and a purchasing bot that answers supplier questions instantly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              prefetch
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              prefetch
              className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Log in
            </Link>
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white hover:bg-white/10 transition"
            >
              Join workspace
            </button>
            <a
              href="#faq"
              className="rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white transition"
            >
              Explore FAQs
            </a>
          </div>
          <div className="flex flex-wrap gap-6 pt-4 text-white/85">
            <div>
              <p className="text-3xl font-bold">2x</p>
              <p className="text-sm">Faster approvals</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm">Bot answers for suppliers</p>
            </div>
            <div>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-sm">Uptime on spend tracking</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div
          className="rounded-2xl border p-6 shadow-sm transition-colors"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-semibold text-[color:var(--foreground)] mb-2">
            Sign up to get going
          </h2>
          <p className="text-[color:var(--muted)] mb-4">
            Create an account to invite your team, set approval rules, and connect your suppliers.
          </p>
          <ul className="space-y-3 text-[color:var(--foreground)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              One-click purchase request creation
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              Approval flows with reminders
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              Real-time status and notifications
            </li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Link
              href="/signup"
              prefetch
              className="rounded-lg px-4 py-2 text-white font-semibold transition"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Sign up
            </Link>
            <Link
              href="/login"
              prefetch
              className="rounded-lg border px-4 py-2 font-semibold transition"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "color-mix(in srgb, var(--card) 90%, transparent)" }}
            >
              Log in
            </Link>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6 shadow-sm transition-colors"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-semibold text-[color:var(--foreground)] mb-2">
            What you can do
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Create and track POs',
              'Automate approvals',
              'Chat with vendors via bot',
              'Centralize receipts & invoices',
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                style={{ backgroundColor: "color-mix(in srgb, var(--card) 94%, transparent)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Built for operations, finance, and procurement teams who need visibility without slowing down requests.
          </p>
        </div>
      </section>

      <section
        className="rounded-2xl border p-6 shadow-sm transition-colors"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-xl font-semibold text-[color:var(--foreground)] mb-4">
          Your purchase order workspace
        </h2>
        <p className="text-sm text-[color:var(--muted)] mb-4">
          Jump into the core flows right after you log in.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Create a new PO', href: '/create-new-po', desc: 'Start a fresh purchase order with items, supplier, and delivery details.' },
            { title: 'POs created by me', href: '/purchase-orders/mine', desc: 'See requests you opened and their current status.' },
            { title: 'Add new suppliers', href: '/suppliers/new', desc: 'Onboard vendors with contacts, terms, and documents.' },
            { title: 'Add delivery address', href: '/addresses/new', desc: 'Manage shipping destinations for your POs.' },
            { title: 'Approve / Reject POs', href: '/purchase-orders/approvals', desc: 'Review pending requests and take action with one click.' },
            { title: "All POs in the project", href: '/purchase-orders', desc: 'Search and filter every PO across your workspace.' },
            { title: 'Create approval levels', href: '/approvals/rules', desc: 'Set thresholds and multi-step workflows for spend control.' },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              prefetch
              className="rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              style={{
                backgroundColor: "color-mix(in srgb, var(--card) 94%, transparent)",
                borderColor: "var(--border)",
              }}
            >
              <div className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                {item.title}
              </div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="faq"
        className="rounded-2xl border p-6 shadow-sm transition-colors"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-xl font-semibold text-[color:var(--foreground)] mb-4">
          FAQs
        </h2>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {[
            {
              q: 'Is there a free trial?',
              a: 'Yes, you can start with the free tier and upgrade when you invite teammates.',
            },
            {
              q: 'Do I need a separate server?',
              a: 'No. Everything runs inside this Next.js app—UI and APIs together.',
            },
            {
              q: 'How do approvals work?',
              a: 'Set rules by amount, vendor, or department. Requesters get status in real time.',
            },
            {
              q: 'Can suppliers use the bot?',
              a: 'Yes. Share a secure link and suppliers can get status or upload documents 24/7.',
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group py-3"
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[color:var(--foreground)]">
                {item.q}
                <span className="text-[color:var(--muted)] group-open:rotate-45 transition">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div
          className="rounded-2xl border p-6 shadow-sm transition-colors"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-2">
            About us
          </h3>
          <p className="text-sm text-[color:var(--muted)]">
            We’re a small team from ops and finance backgrounds. Our mission: make purchasing transparent, fast, and audit-ready without adding headcount.
          </p>
        </div>
        <div
          className="rounded-2xl border p-6 shadow-sm transition-colors"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-2">
            Quick start guide
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-[color:var(--foreground)]">
            <li>Sign up and verify your email.</li>
            <li>Create your first approval rule (amount threshold).</li>
            <li>Add a supplier and submit a PO request.</li>
            <li>Share the bot link with suppliers for status updates.</li>
          </ol>
        </div>
      </section>

      <section
        className="rounded-2xl border p-6 shadow-sm transition-colors"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
              Connect with us
            </h3>
            <p className="text-sm text-[color:var(--muted)]">
              Have questions or need a walkthrough? We’ll respond within one business day.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="mailto:hello@purchaseorder.app"
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "color-mix(in srgb, var(--card) 90%, transparent)" }}
            >
              Email
            </a>
            <a
              href="https://cal.com"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>

      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-lg"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  Join workspace
                </p>
                <h3 className="mt-2 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Enter invite code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJoinOpen(false)}
                className="text-sm font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleJoin}>
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Full name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Role
                </label>
                <input
                  required
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  placeholder="Developer, Manager, Designer..."
                  style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Invite code
                </label>
                <input
                  required
                  value={form.joinCode}
                  onChange={(e) => updateField('joinCode', e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)', color: 'var(--foreground)' }}
                />
              </div>
              <button
                type="submit"
                disabled={joining}
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: joining ? 0.7 : 1 }}
              >
                {joining ? 'Joining…' : 'Join workspace'}
              </button>
              {joinMessage && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {joinMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
