// GET /api/auth
// Purpose: simple auth check stub (returns authenticated: true)
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const ok = requireAuth();
  return NextResponse.json({ authenticated: ok });
}
