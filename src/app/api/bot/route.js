// POST /api/bot
// Purpose: forward a message to the bot service and return its reply
import { NextResponse } from 'next/server';
import { chatWithBot } from '@/services/botService';

export async function POST(request) {
  const { message } = await request.json();
  const result = await chatWithBot(message || '');
  return NextResponse.json(result);
}
