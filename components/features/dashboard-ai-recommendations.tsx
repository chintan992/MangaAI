'use client';

import React, { useEffect, useState } from 'react';

import { searchManga, Manga } from '@/lib/anilist';
import { MangaCard } from '@/components/features/manga-card';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '@/lib/user-context';

export function DashboardAIRecommendations({ 
  onSelectMedia,
  favorites,
  current
}: { 
  onSelectMedia?: (id: number) => void;
  favorites: any[];
  current: any[];
}) {
  const { state, saveRecommendations } = useUser();
  const [recommendations, setRecommendations] = useState<{ manga: Manga; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAI() {
      if (!state.preferences.enableAIRecommendations) {
        setLoading(false);
        return;
      }

      if (favorites.length === 0 && current.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Combine favorites and current to form the "liked" array for the AI prompt
        const combined = [...favorites, ...current].map(item => ({
          title: item.title,
          id: item.id
        })) as any;

        // Fetch rated manga details from state for constraints
        const highlyRated = Object.keys(state.ratings)
          .filter(id => state.ratings[Number(id)] >= 4)
          .map(id => String(id)); // In a full implementation we'd fetch titles, but keeping it simple
          
        const poorlyRated = Object.keys(state.ratings)
          .filter(id => state.ratings[Number(id)] <= 2)
          .map(id => String(id));
        
        const previouslyRecommended = state.recommendationHistory.flatMap(h => h.recommendations.map(r => r.title));

        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            likedManga: combined,
            favoriteGenres: state.preferences.favoriteGenres || [],
            options: {
              previouslyRecommended,
              highlyRated: [], // Mocking for now to save API calls
              poorlyRated: [],
              enableWebSearch: state.preferences.enableWebSearch ?? false,
            }
          }),
        });

        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const { recommendations: recs } = await res.json() as { recommendations: { title: string, reason: string }[] };

        if (recs.length > 0) {
          // Limit to 3 for the dashboard row
          const topRecs = recs.slice(0, 3);
          
          const mangaPromises = topRecs.map(async (rec) => {
            const results = await searchManga(rec.title, 1, 1);
            return {
              manga: results[0],
              reason: rec.reason
            };
          });
          
          const resolvedRecs = await Promise.all(mangaPromises);
          const validRecs = resolvedRecs.filter((r) => r.manga !== undefined);
          setRecommendations(validRecs);
          
          if (validRecs.length > 0) {
            saveRecommendations(validRecs.map(r => ({
              mangaId: r.manga.id,
              title: r.manga.title.english || r.manga.title.romaji,
              reason: r.reason
            })));
          }
        }
      } catch (err) {
        console.error("Dashboard AI Recs Error:", err);
        setError("Could not generate recommendations at this time.");
      } finally {
        setLoading(false);
      }
    }

    // Only run if we haven't fetched yet
    if (recommendations.length === 0) {
        fetchAI();
    }
  }, [favorites, current, state.preferences.favoriteGenres, state.recommendationHistory, saveRecommendations, recommendations.length]);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          AI Suggested for You
        </h2>
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    if (!state.preferences.enableAIRecommendations) {
      return (
        <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center">
          <Sparkles className="mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">AI Recommendations are disabled.</p>
          <p className="text-xs text-zinc-500 mt-1">Enable &quot;AI Features&quot; in Preferences to see smart suggestions based on your AniList.</p>
        </div>
      );
    }
    return null; // Hide the section seamlessly if it fails or has no data
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-sm"
    >
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        AI Suggested for You
      </h2>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div 
            key={rec.manga.id} 
            className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-indigo-500/30 cursor-pointer"
            onClick={() => onSelectMedia?.(rec.manga.id)}
          >
            <div className="w-16 shrink-0">
               <MangaCard manga={rec.manga} compact={true} onClick={(m) => onSelectMedia?.(m.id)} />
            </div>
            <div className="flex-1 overflow-hidden py-1">
              <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-indigo-300">
                {rec.manga.title.english || rec.manga.title.romaji}
              </h4>
              <p className="mt-1 text-xs text-indigo-200/70 italic line-clamp-3 leading-relaxed">
                &quot;{rec.reason}&quot;
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
