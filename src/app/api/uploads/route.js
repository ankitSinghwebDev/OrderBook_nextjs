// POST /api/uploads - returns Cloudinary signed payload for direct browser uploads
import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  if (!process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { message: 'Cloudinary is not configured. Set CLOUDINARY_* env vars.' },
      { status: 500 }
    );
  }

  try {
    const { folder = 'orderbook', publicId } = await req.json();
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        ...(publicId ? { public_id: publicId } : {}),
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      timestamp,
      signature,
      ...(publicId ? { publicId } : {}),
    });
  } catch (err) {
    console.error('POST /api/uploads error', err);
    return NextResponse.json({ message: 'Failed to sign upload' }, { status: 500 });
  }
}
