import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/ai-recommendations';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { likedManga, favoriteGenres, options } = await req.json();
    const recommendations = await getRecommendations(likedManga, favoriteGenres, options);
    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('API /recommendations error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
