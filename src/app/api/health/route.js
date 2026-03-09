// GET /api/health
// Purpose: basic API heartbeat plus DB connection check
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  let dbStatus = 'disconnected';

  try {
    await connectDB();
    dbStatus = 'connected';
  } catch (_err) {
    dbStatus = 'failed';
  }

  return NextResponse.json({
    status: 'OK',
    message: 'Next.js API running',
    dbStatus,
    timestamp: new Date().toISOString(),
  });
}
