import { NextResponse } from 'next/server';
import { getQuickPitch } from '@/lib/ai-recommendations';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    const pitch = await getQuickPitch(title, description);
    return NextResponse.json({ pitch });
  } catch (error: any) {
    console.error('API /quick-pitch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate quick pitch' },
      { status: 500 }
    );
  }
}
