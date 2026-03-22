'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useJoinWorkspaceMutation } from '@/store/apiSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';

export default function HomeContent() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', role: 'viewer', joinCode: '', password: '', confirmPassword: '',
  });
  const [joinWorkspace, { isLoading: joining }] = useJoinWorkspaceMutation();
  const [joinMessage, setJoinMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Vendor', value: 'vendor' },
  ];

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const code = searchParams.get('joinCode');
    if (code) {
      setJoinOpen(true);
      setForm((prev) => ({
        ...prev,
        joinCode: code.toUpperCase(),
        email: searchParams.get('email') || prev.email,
        role: searchParams.get('role') || prev.role || 'viewer',
        name: searchParams.get('name') || prev.name,
      }));
    }
  }, [searchParams]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinMessage('');
    if (form.password.length < 8) { setJoinMessage('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { setJoinMessage('Passwords do not match.'); return; }
    try {
      const res = await joinWorkspace({
        name: form.name, email: form.email, role: form.role, joinCode: form.joinCode, password: form.password,
      }).unwrap();
      if (res?.user?._id) {
        dispatch(setUser({ user: res.user, token: res.token }));
        window.localStorage.setItem('isAuthed', 'true');
        window.localStorage.setItem('userId', res.user._id || '');
        window.localStorage.setItem('userEmail', res.user.email || '');
        window.localStorage.setItem('userName', res.user.name || '');
        window.localStorage.setItem('workspaceId', res?.workspace?.workspaceId || '');
        router.replace('/dashboard');
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
        <div className="relative max-w-4xl space-y-6">
          <p className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-sm font-semibold backdrop-blur">
            New - Faster purchasing, happier finance
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Run purchasing on autopilot — request, approve, and track in minutes.
          </h1>
          <p className="text-lg sm:text-xl text-white/85">
            Purchase Order helps teams create, approve, and reconcile spend with built-in workflows, real-time tracking, and a purchasing bot that answers supplier questions instantly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" prefetch className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
              Create free account
            </Link>
            <Link href="/login" prefetch className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
              Log in
            </Link>
            <button type="button" onClick={() => setJoinOpen(true)} className="rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white hover:bg-white/10 transition">
              Join workspace
            </button>
            <a href="#faq" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white transition">
              Explore FAQs
            </a>
          </div>
          <div className="flex flex-wrap gap-6 pt-4 text-white/85">
            <div><p className="text-3xl font-bold">2x</p><p className="text-sm">Faster approvals</p></div>
            <div><p className="text-3xl font-bold">24/7</p><p className="text-sm">Bot answers for suppliers</p></div>
            <div><p className="text-3xl font-bold">99.9%</p><p className="text-sm">Uptime on spend tracking</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Sign up to get going</h2>
          <p className="text-[var(--muted)] mb-4">Create an account to invite your team, set approval rules, and connect your suppliers.</p>
          <ul className="space-y-3 text-[var(--foreground)]">
            {['One-click purchase request creation', 'Approval flows with reminders', 'Real-time status and notifications'].map((t) => (
              <li key={t} className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />{t}</li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Link href="/signup" prefetch className="rounded-lg px-4 py-2 text-white font-semibold" style={{ backgroundColor: "var(--accent)" }}>Sign up</Link>
            <Link href="/login" prefetch className="rounded-lg border px-4 py-2 font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Log in</Link>
          </div>
        </div>
        <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">What you can do</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Create and track POs', 'Automate approvals', 'Chat with vendors via bot', 'Centralize receipts & invoices'].map((item) => (
              <div key={item} className="rounded-xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Your purchase order workspace</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Jump into the core flows right after you log in.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Create a new PO', href: '/purchase-orders/new', desc: 'Start a fresh purchase order with items, supplier, and delivery details.' },
            { title: 'All Purchase Orders', href: '/purchase-orders', desc: 'Search and filter every PO across your workspace.' },
            { title: 'Manage Suppliers', href: '/suppliers', desc: 'Onboard vendors with contacts, terms, and documents.' },
            { title: 'Delivery Addresses', href: '/addresses', desc: 'Manage shipping destinations for your POs.' },
            { title: 'Approve / Reject POs', href: '/purchase-orders/approvals', desc: 'Review pending requests and take action with one click.' },
            { title: 'Dashboard', href: '/dashboard', desc: 'Overview of spend, PO counts, and approval activity.' },
          ].map((item) => (
            <Link key={item.title} href={item.href} prefetch className="rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: "var(--border)" }}>
              <div className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />{item.title}
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section id="faq" className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">FAQs</h2>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {[
            { q: 'Is there a free trial?', a: 'Yes, you can start with the free tier and upgrade when you invite teammates.' },
            { q: 'Do I need a separate server?', a: 'No. Everything runs inside this Next.js app — UI and APIs together.' },
            { q: 'How do approvals work?', a: 'Set rules by amount, vendor, or department. Requesters get status in real time.' },
            { q: 'Can suppliers use the bot?', a: 'Yes. Share a secure link and suppliers can get status or upload documents 24/7.' },
          ].map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[var(--foreground)]">
                {item.q}<span className="text-[var(--muted)] group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">About us</h3>
          <p className="text-sm text-[var(--muted)]">We are a small team from ops and finance backgrounds. Our mission: make purchasing transparent, fast, and audit-ready without adding headcount.</p>
        </div>
        <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Quick start guide</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--foreground)]">
            <li>Sign up and verify your email.</li>
            <li>Create your first approval rule (amount threshold).</li>
            <li>Add a supplier and submit a PO request.</li>
            <li>Share the bot link with suppliers for status updates.</li>
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Connect with us</h3>
            <p className="text-sm text-[var(--muted)]">Have questions or need a walkthrough? We will respond within one business day.</p>
          </div>
          <div className="flex gap-3">
            <a href="mailto:hello@purchaseorder.app" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Email</a>
            <a href="https://cal.com" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Book a demo</a>
          </div>
        </div>
      </section>

      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border p-8 shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>Join workspace</p>
                <h3 className="mt-1 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Enter your details</h3>
              </div>
              <button type="button" onClick={() => setJoinOpen(false)} className="rounded-md p-1 hover:opacity-70" style={{ color: 'var(--muted)' }}>X</button>
            </div>
            <form className="space-y-5" onSubmit={handleJoin}>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Invite Code</label>
                <div className="relative">
                  <input required value={form.joinCode} onChange={(e) => updateField('joinCode', e.target.value.toUpperCase())} placeholder="e.g. AB1C2D"
                    className="w-full rounded-lg border px-4 py-2.5 text-lg font-mono tracking-widest"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  {form.joinCode && <button type="button" onClick={() => updateField('joinCode', '')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>X</button>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Full Name</label>
                  <input required value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Your name" className="w-full rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Email</label>
                  <input type="email" required value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@company.com" className="w-full rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Role</label>
                <select required value={form.role} onChange={(e) => updateField('role', e.target.value)} className="w-full rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                  {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Min 8 characters" className="w-full rounded-lg border px-3 py-2.5 pr-10" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--muted)' }}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Re-enter password" className="w-full rounded-lg border px-3 py-2.5 pr-10" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--muted)' }}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={joining} className="w-full rounded-lg px-4 py-3 text-sm font-semibold mt-2" style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: joining ? 0.7 : 1 }}>
                {joining ? 'Joining...' : 'Join Workspace'}
              </button>
              {joinMessage && <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>{joinMessage}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
