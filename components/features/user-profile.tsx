'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { getAniListUser } from '@/lib/anilist';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import Image from 'next/image';

export function UserProfile() {
  const { state, setAniListAuth, logoutAniList } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'ANILIST_AUTH_SUCCESS') {
        const token = event.data.token;
        try {
          const user = await getAniListUser(token);
          if (user) {
            setAniListAuth(token, user);
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
        }
        setIsConnecting(false);
      } else if (event.data?.type === 'ANILIST_AUTH_ERROR') {
        setIsConnecting(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAniListAuth]);

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
    if (!clientId) {
      alert("AniList Client ID is not configured. Please set NEXT_PUBLIC_ANILIST_CLIENT_ID in your environment variables.");
      return;
    }
    
    setIsConnecting(true);
    // AniList Authorization Code Grant URL
    const redirectUri = `${window.location.origin}/auth/callback`;
    const url = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const authWindow = window.open(
      url,
      'anilist_auth',
      'width=600,height=700'
    );

    if (!authWindow) {
      alert('Please allow popups for this site to connect your AniList account.');
      setIsConnecting(false);
    }
  };

  if (state.aniListUser) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 p-1.5 sm:pr-4 sm:py-1.5 border border-white/10 shadow-sm backdrop-blur-md">
          <div className="relative h-7 w-7 overflow-hidden rounded-full">
            <Image 
              src={state.aniListUser.avatar.medium} 
              alt={state.aniListUser.name} 
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-white tracking-wide">{state.aniListUser.name}</span>
        </div>
        <button 
          onClick={logoutAniList} 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-all hover:bg-rose-500/20 hover:text-rose-400 border border-transparent hover:border-rose-500/30"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin} 
      disabled={isConnecting} 
      className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40"
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      {isConnecting ? 'Connecting...' : 'Login with AniList'}
    </button>
  );
}
