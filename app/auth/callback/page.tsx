'use client';

import { useEffect, useState } from 'react';

export default function AuthCallback() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setErrorMsg('Authorization failed or was denied.');
        if (window.opener) {
          window.opener.postMessage({ type: 'ANILIST_AUTH_ERROR' }, '*');
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      if (code) {
        try {
          const redirectUri = `${window.location.origin}/auth/callback`;
          const response = await fetch('/api/auth/anilist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, redirectUri }),
          });

          const data = await response.json();

          if (response.ok && data.token) {
            if (window.opener) {
              window.opener.postMessage({ type: 'ANILIST_AUTH_SUCCESS', token: data.token }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          } else {
            setErrorMsg(data.error || 'Failed to exchange authorization code.');
            if (window.opener) {
              window.opener.postMessage({ type: 'ANILIST_AUTH_ERROR' }, '*');
              setTimeout(() => window.close(), 3000);
            }
          }
        } catch (err) {
          console.error('Error exchanging code:', err);
          setErrorMsg('An unexpected error occurred.');
          if (window.opener) {
            window.opener.postMessage({ type: 'ANILIST_AUTH_ERROR' }, '*');
            setTimeout(() => window.close(), 3000);
          }
        }
      } else {
        // Fallback for implicit grant just in case or if no code is present
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get('access_token');
          
          if (token && window.opener) {
            window.opener.postMessage({ type: 'ANILIST_AUTH_SUCCESS', token }, '*');
            window.close();
            return;
          }
        }
        
        setErrorMsg('No authorization code found.');
        if (window.opener) {
          window.opener.postMessage({ type: 'ANILIST_AUTH_ERROR' }, '*');
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => { window.location.href = '/'; }, 3000);
        }
      }
    };

    processAuth();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4 text-center">
        {errorMsg ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <p className="text-lg font-medium text-rose-400">{errorMsg}</p>
            <p className="text-sm text-zinc-400">This window will close automatically.</p>
          </>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-lg font-medium text-white">Authenticating with AniList...</p>
            <p className="text-sm text-zinc-400">Please wait while we securely log you in.</p>
          </>
        )}
      </div>
    </div>
  );
}
