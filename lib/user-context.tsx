'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Manga } from '@/lib/anilist';

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface UserPreferences {
  favoriteGenres: string[];
  enableAIRecommendations?: boolean;
  enableWebSearch?: boolean;
}

export interface RecommendationHistoryItem {
  id: string;
  date: string;
  recommendations: {
    mangaId: number;
    title: string;
    reason: string;
  }[];
}

export interface AniListUser {
  id: number;
  name: string;
  avatar: {
    large: string;
    medium: string;
  };
}

export interface UserState {
  likedMangaIds: number[];
  ratings: Record<number, Rating>;
  preferences: UserPreferences;
  recommendationHistory: RecommendationHistoryItem[];
  aniListToken: string | null;
  aniListUser: AniListUser | null;
}

interface UserContextType {
  state: UserState;
  toggleLike: (mangaId: number) => void;
  rateManga: (mangaId: number, rating: Rating) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  saveRecommendations: (recommendations: { mangaId: number; title: string; reason: string }[]) => void;
  clearHistory: () => void;
  isLiked: (mangaId: number) => boolean;
  getRating: (mangaId: number) => Rating | undefined;
  setAniListAuth: (token: string, user: AniListUser) => void;
  logoutAniList: () => void;
}

const defaultState: UserState = {
  likedMangaIds: [],
  ratings: {},
  preferences: {
    favoriteGenres: [],
    enableAIRecommendations: false,
    enableWebSearch: false,
  },
  recommendationHistory: [],
  aniListToken: null,
  aniListUser: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('manga_ai_user_state');
    if (savedState) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(JSON.parse(savedState));
      } catch (e) {
        console.error('Failed to parse user state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('manga_ai_user_state', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const toggleLike = (mangaId: number) => {
    setState((prev) => {
      const isLiked = prev.likedMangaIds.includes(mangaId);
      return {
        ...prev,
        likedMangaIds: isLiked
          ? prev.likedMangaIds.filter((id) => id !== mangaId)
          : [...prev.likedMangaIds, mangaId],
      };
    });
  };

  const rateManga = (mangaId: number, rating: Rating) => {
    setState((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [mangaId]: rating,
      },
    }));
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...preferences,
      },
    }));
  };

  const saveRecommendations = (recommendations: { mangaId: number; title: string; reason: string }[]) => {
    setState((prev) => ({
      ...prev,
      recommendationHistory: [
        {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          recommendations,
        },
        ...(prev.recommendationHistory || []),
      ],
    }));
  };

  const clearHistory = () => {
    setState((prev) => ({
      ...prev,
      recommendationHistory: [],
    }));
  };

  const setAniListAuth = useCallback((token: string, user: AniListUser) => {
    setState((prev) => ({
      ...prev,
      aniListToken: token,
      aniListUser: user,
    }));
  }, []);

  const logoutAniList = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aniListToken: null,
      aniListUser: null,
    }));
  }, []);

  const isLiked = (mangaId: number) => state.likedMangaIds.includes(mangaId);
  const getRating = (mangaId: number) => state.ratings[mangaId];

  return (
    <UserContext.Provider
      value={{
        state,
        toggleLike,
        rateManga,
        updatePreferences,
        saveRecommendations,
        clearHistory,
        isLiked,
        getRating,
        setAniListAuth,
        logoutAniList,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
