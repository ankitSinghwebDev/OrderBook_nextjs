// POST /api/auth/forgot
// Purpose: generate a password reset token (15 min) and email the reset link
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendMail } from '@/lib/email';


const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }

    // Always respond 200 to avoid email enumeration, but only create token for existing users
    const user = await User.findOne({ email });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.resetToken = hashedToken;
      user.resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save();

      const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
      const html = `
        <p>Hello ${user.name || 'there'},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `;

      try {
        await sendMail({
          to: email,
          subject: 'Reset your password',
          html,
          text: `Reset your password: ${resetUrl}`,
        });
      } catch (err) {
        console.warn('[forgot] email send failed:', err.message);
      }
    }

    return NextResponse.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    console.error('POST /api/auth/forgot error:', error);
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}
