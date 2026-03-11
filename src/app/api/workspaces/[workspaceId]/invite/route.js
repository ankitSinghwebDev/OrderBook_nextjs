// POST /api/workspaces/[workspaceId]/invite - send an email invite with role + join code
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';
import WorkspaceInvite from '@/models/WorkspaceInvite';
import { sendMail } from '@/lib/email';

const ALLOWED_ROLES = ['admin', 'manager', 'member', 'viewer', 'vendor', 'user'];

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  return ALLOWED_ROLES.includes(value) ? value : 'viewer';
};

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { workspaceId } = params;
    const body = await req.json();
    const { email, role = 'viewer', inviterUserId } = body || {};

    if (!workspaceId) {
      return NextResponse.json({ message: 'workspaceId is required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }
    if (!inviterUserId) {
      return NextResponse.json({ message: 'inviterUserId is required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    const workspace = await Workspace.findOne({ workspaceId });
    if (!workspace) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });
    }

    const inviter = await User.findById(inviterUserId);
    if (!inviter || inviter.workspaceId !== workspaceId || (!inviter.isCreator && inviter.role !== 'admin')) {
      return NextResponse.json({ message: 'Only workspace admins can send invites' }, { status: 403 });
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const invite = await WorkspaceInvite.findOneAndUpdate(
      { workspaceId: workspace.workspaceId, email: normalizedEmail },
      {
        $set: {
          joinCode: workspace.joinCode,
          role: normalizedRole,
          invitedByUserId: inviter._id,
          status: 'pending',
          expiresAt,
        },
        $unset: { acceptedAt: '' },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const url = new URL(req.url);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${url.protocol}//${url.host}`);
    const joinLink = `${baseUrl}/home?joinCode=${workspace.joinCode}&email=${encodeURIComponent(
      normalizedEmail
    )}&role=${normalizedRole}`;

    const subject = `${inviter.name || 'A teammate'} invited you to ${workspace.name}`;
    const html = `
      <p>Hi ${normalizedEmail.split('@')[0]},</p>
      <p>${inviter.name || 'A teammate'} added you to the <strong>${workspace.name}</strong> workspace.</p>
      <p>Your assigned role: <strong style="text-transform: capitalize;">${normalizedRole}</strong></p>
      <p>Use this join code: <strong>${workspace.joinCode}</strong></p>
      <p><a href="${joinLink}" style="display:inline-block;padding:10px 16px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none">Join workspace</a></p>
      <p>If the button does not work, copy and paste this link:<br/>${joinLink}</p>
    `;
    const text = `You were invited to ${workspace.name} as a ${normalizedRole}.\nJoin code: ${workspace.joinCode}\nJoin: ${joinLink}`;

    let emailStatus = 'sent';
    let emailError = null;
    try {
      const res = await sendMail({ to: normalizedEmail, subject, html, text });
      if (res?.skipped) emailStatus = 'skipped';
    } catch (err) {
      emailStatus = 'failed';
      emailError = err?.message || 'Email send failed';
      console.error('[invite] email send failed:', err);
      // Continue; user can still share join code manually.
    }

    return NextResponse.json(
      {
        invite: {
          id: invite._id.toString(),
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
        },
        joinCode: workspace.joinCode,
        emailStatus,
        ...(emailError ? { emailError } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/workspaces/[workspaceId]/invite error:', error);
    return NextResponse.json({ message: 'Failed to send invite' }, { status: 500 });
  }
}
