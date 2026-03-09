'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import { useGetUserByIdQuery, useRegenerateJoinCodeMutation, useListWorkspaceMembersQuery } from '@/store/apiSlice';

const actions = [
  { title: 'Create a new PO', href: '/create-new-po', desc: 'Start a fresh purchase order with items, supplier, and delivery details.' },
  { title: 'POs created by me', href: '/purchase-orders/mine', desc: 'See requests you opened and their current status.' },
  { title: 'Add new suppliers', href: '/suppliers/new', desc: 'Onboard vendors with contacts, terms, and documents.' },
  { title: 'Add delivery address', href: '/addresses/new', desc: 'Manage shipping destinations for your POs.' },
  { title: 'Approve / Reject POs', href: '/purchase-orders/approvals', desc: 'Review pending requests and act quickly.' },
  { title: "All POs in the project", href: '/purchase-orders', desc: 'Search and filter every PO across your workspace.' },
  { title: 'Create approval levels', href: '/approvals/rules', desc: 'Configure thresholds and multi-step workflows.' },
];

export default function WorkspacePage() {
  const [userId, setUserId] = useState(null);
  const reduxUser = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [regenJoinCode, { isLoading: isRegenLoading }] = useRegenerateJoinCodeMutation();
  const workspaceId = reduxUser?.workspaceId || (typeof window !== 'undefined' && window.localStorage.getItem('workspaceId')) || null;
  const { data: membersData } = useListWorkspaceMembersQuery(workspaceId, { skip: !workspaceId });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = window.localStorage.getItem('userId');
      if (id) setUserId(id);
      const savedJoin = window.localStorage.getItem('joinCode');
      if (savedJoin) setInviteCode(savedJoin);
    }
  }, []);

  const { data, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });

  useEffect(() => {
    if (reduxUser) return;
    if (data?.user) {
      dispatch(setUser({ user: data.user }));
    }
  }, [data?.user, reduxUser, dispatch]);

  const handleGenerateInvite = async () => {
    if (!reduxUser?.workspaceId || !reduxUser?._id) return;
    try {
      const res = await regenJoinCode({
        workspaceId: reduxUser.workspaceId,
        requesterUserId: reduxUser._id,
      }).unwrap();
      const code = res?.joinCode || inviteCode;
      setInviteCode(code);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('joinCode', code || '');
      }
    } catch (err) {
      console.error('Failed to regenerate code', err);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode || !navigator?.clipboard) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(inviteCode);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-[color:var(--background)] py-10 transition-colors">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl animate-orb"
        style={{ backgroundColor: "var(--accent-soft)" }}
      />
      <div
        className="pointer-events-none absolute right-[-6rem] top-40 h-80 w-80 rounded-full blur-3xl animate-orb-slow"
        style={{ backgroundColor: "var(--accent-softer)" }}
      />
      <div
        className="pointer-events-none absolute left-1/3 bottom-10 h-96 w-96 rounded-full blur-3xl animate-spin-slow"
        style={{ backgroundColor: "var(--accent-soft)" }}
      />

      <div className="relative mx-auto max-w-6xl px-6 space-y-8">
        <div className="space-y-3">
          <p className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--card)] px-4 py-1 text-xs font-semibold text-[color:var(--accent)] shadow-sm">
            Workspace
          </p>
          <h1 className="text-3xl font-bold text-[color:var(--foreground)]">
            Purchase Order Workspace
          </h1>
          <p className="text-[color:var(--muted)]">
            Choose an action to continue. Your most-used flows are one click away.
          </p>
        </div>

        <div
          className="rounded-2xl border p-4 shadow-sm backdrop-blur transition-colors"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          {isLoading && !reduxUser ? (
            <p className="text-sm text-[color:var(--muted)]">Loading your profile…</p>
          ) : reduxUser ? (
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-semibold"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {reduxUser.name?.[0]?.toUpperCase() || reduxUser.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{reduxUser.name || 'User'}</p>
                <p className="text-xs text-[color:var(--muted)]">{reduxUser.email}</p>
              </div>
              {reduxUser?.isCreator && (
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(true)}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                  >
                    Generate invite code
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Not signed in.{" "}
              <a href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
                Log in
              </a>
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-xl border p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                {item.title}
              </div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">{item.desc}</div>
            </a>
          ))}
        </div>

        {reduxUser?.workspaceId && (
          <div
            className="rounded-2xl border p-4 shadow-sm backdrop-blur transition-colors"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  Workspace Members
                </p>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {membersData?.members?.length || 0} people
                </h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(membersData?.members || []).map((member) => (
                <div
                  key={member.userId}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {member?.name?.[0]?.toUpperCase() || member?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {member.name || 'Member'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                    <span
                      className="rounded-full px-2 py-1 font-semibold"
                      style={{ backgroundColor: 'var(--accent-softer)', color: 'var(--foreground)' }}
                    >
                      {member.role || 'viewer'}
                    </span>
                    {member.isOwner && (
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-semibold"
                        style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        Owner
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!membersData?.members || membersData.members.length === 0) && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  No members yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-lg"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  Invite to workspace
                </p>
                <h3 className="mt-2 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Share your invite code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-sm font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Anyone with this code can join your workspace. Share it securely.
              </p>
              <div
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--card) 94%, transparent)' }}
              >
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {inviteCode || '------'}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!inviteCode || isCopying}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: inviteCode ? 1 : 0.5 }}
                >
                  {isCopying ? 'Copied…' : 'Copy'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={isRegenLoading}
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors border"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'color-mix(in srgb, var(--card) 92%, transparent)',
                  color: 'var(--foreground)',
                }}
              >
                {isRegenLoading ? 'Generating…' : 'Generate new code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
