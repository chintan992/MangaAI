import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
    const clientSecret = process.env.ANILIST_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing AniList OAuth credentials');
      return NextResponse.json(
        { error: 'Server configuration error: Missing AniList credentials' },
        { status: 500 }
      );
    }

    const response = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: Number(clientId),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AniList token exchange failed:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to exchange authorization code' },
        { status: response.status }
      );
    }

    return NextResponse.json({ token: data.access_token });
  } catch (error) {
    console.error('Error in AniList token exchange:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
