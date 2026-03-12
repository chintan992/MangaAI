'use client';

import React, { useState, useEffect } from 'react';
import { fetchTrendingManga, searchManga, fetchMangaByIds, fetchMangaById, Manga } from '@/lib/anilist';
import { getRecommendations, Recommendation } from '@/lib/ai-recommendations';
import { useUser } from '@/lib/user-context';
import { MangaCard } from '@/components/manga-card';
import { MangaDetailsModal } from '@/components/manga-details-modal';
import { UserProfile } from '@/components/user-profile';
import { UserPreferencesModal } from '@/components/user-preferences-modal';
import { Dashboard } from '@/components/dashboard';
import { Search, Sparkles, TrendingUp, Settings, Loader2, BookOpen, Heart, History, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'discover' | 'mylist' | 'history' | 'dashboard';

export default function Home() {
  const { state, saveRecommendations, clearHistory } = useUser();
  const [trending, setTrending] = useState<Manga[]>([]);
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [likedMangaDetails, setLikedMangaDetails] = useState<Manga[]>([]);
  
  const [recommendations, setRecommendations] = useState<{ manga: Manga; reason: string }[]>([]);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      const data = await fetchTrendingManga(1, 12);
      setTrending(data);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const results = await searchManga(searchQuery, 1, 12);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    async function loadLikedManga() {
      if (state.likedMangaIds.length > 0) {
        const details = await fetchMangaByIds(state.likedMangaIds);
        setLikedMangaDetails(details);
      } else {
        setLikedMangaDetails([]);
      }
    }
    loadLikedManga();
  }, [state.likedMangaIds]);

  const handleGenerateRecommendations = async () => {
    setIsGeneratingRecs(true);
    setRecError(null);
    try {
      // Fetch user's liked manga details to pass to AI
      const likedMangaDetails = await fetchMangaByIds(state.likedMangaIds);
      
      // Fetch rated manga details for better personalization
      const ratedIds = Object.keys(state.ratings).map(Number);
      const ratedMangaDetails = ratedIds.length > 0 ? await fetchMangaByIds(ratedIds) : [];
      
      const highlyRated = ratedMangaDetails
        .filter(m => state.ratings[m.id] >= 4)
        .map(m => m.title.english || m.title.romaji);
        
      const poorlyRated = ratedMangaDetails
        .filter(m => state.ratings[m.id] <= 2)
        .map(m => m.title.english || m.title.romaji);
      
      const previouslyRecommended = state.recommendationHistory.flatMap(h => h.recommendations.map(r => r.title));
      
      const recs = await getRecommendations(likedMangaDetails, state.preferences.favoriteGenres, {
        previouslyRecommended,
        highlyRated,
        poorlyRated
      });
      
      if (recs.length > 0) {
        // Search Anilist for the recommended titles
        const mangaPromises = recs.map(async (rec) => {
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
        } else {
          setRecError("We generated recommendations, but couldn't find them in the database. Please try again.");
        }
      } else {
        setRecError("Failed to generate recommendations. Please try again.");
      }
    } catch (error) {
      console.error("Failed to generate recommendations", error);
      setRecError("An error occurred while generating recommendations.");
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  const handleSelectRelated = async (id: number) => {
    const relatedManga = await fetchMangaById(id);
    if (relatedManga) {
      setSelectedManga(relatedManga);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline text-xl font-bold tracking-tight text-white">MangaAI</span>
          </div>
          
          <div className="flex flex-1 items-center justify-center px-4 sm:px-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search manga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
              <button
                onClick={() => { setActiveTab('discover'); setSearchQuery(''); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'discover' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                Discover
              </button>
              <button
                onClick={() => { setActiveTab('mylist'); setSearchQuery(''); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'mylist' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                My List
              </button>
              <button
                onClick={() => { setActiveTab('history'); setSearchQuery(''); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                AI History
              </button>
              {state.aniListToken && (
                <button
                  onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'dashboard' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
              )}
            </div>

            <UserProfile />

            <button
              onClick={() => setIsPreferencesOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
        {/* Hero Section */}
        {!searchQuery && activeTab === 'discover' && (
          <section className="mb-16 mt-8 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300"
            >
              <Sparkles className="h-4 w-4" />
              Powered by Google Gemini
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Discover your next favorite <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">manga</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 max-w-2xl text-lg text-zinc-400"
            >
              Our AI analyzes your reading history and preferences to curate personalized manga recommendations just for you.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex gap-4"
            >
              <button
                onClick={handleGenerateRecommendations}
                disabled={isGeneratingRecs || (state.likedMangaIds.length === 0 && state.preferences.favoriteGenres.length === 0)}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 shadow-xl transition-all hover:bg-zinc-100 hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingRecs ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110 text-indigo-600" />
                )}
                Generate AI Recommendations
              </button>
            </motion.div>
            {recError && (
              <p className="mt-4 text-sm text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
                {recError}
              </p>
            )}
            {(state.likedMangaIds.length === 0 && state.preferences.favoriteGenres.length === 0) && (
              <p className="mt-4 text-xs text-zinc-500">
                Like some manga or set your preferences to enable AI recommendations.
              </p>
            )}
          </section>
        )}

        {/* Search Results */}
        {searchQuery && (
          <section className="mb-16">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
              <Search className="h-6 w-6 text-indigo-400" />
              Search Results for &quot;{searchQuery}&quot;
            </h2>
            {isSearching ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {searchResults.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} onClick={setSelectedManga} />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-zinc-400">
                <Search className="mb-4 h-12 w-12 text-zinc-600" />
                <p>No manga found matching your search.</p>
              </div>
            )}
          </section>
        )}

        {/* AI Recommendations */}
        {!searchQuery && activeTab === 'discover' && recommendations.length > 0 && (
          <section className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <Sparkles className="h-6 w-6 text-indigo-400" />
                AI Curated For You
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={rec.manga.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10"
                >
                  <div className="flex p-4 gap-4">
                    <div className="w-24 shrink-0">
                      <MangaCard manga={rec.manga} onClick={setSelectedManga} compact={true} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-lg font-bold text-white line-clamp-2 mb-2">
                        {rec.manga.title.english || rec.manga.title.romaji}
                      </h3>
                      <p className="text-sm text-indigo-200/70 italic line-clamp-4 leading-relaxed">
                        &quot;{rec.reason}&quot;
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        {!searchQuery && activeTab === 'discover' && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <TrendingUp className="h-6 w-6 text-rose-400" />
                Trending Now
              </h2>
            </div>
            {trending.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {trending.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} onClick={setSelectedManga} />
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            )}
          </section>
        )}
        {/* My List Tab */}
        {!searchQuery && activeTab === 'mylist' && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <Heart className="h-6 w-6 text-rose-400" />
                My Liked Manga
              </h2>
            </div>
            {likedMangaDetails.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {likedMangaDetails.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} onClick={setSelectedManga} />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-zinc-400">
                <Heart className="mb-4 h-12 w-12 text-zinc-600" />
                <p>You haven&apos;t liked any manga yet.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 text-indigo-400 hover:text-indigo-300"
                >
                  Discover some manga
                </button>
              </div>
            )}
          </section>
        )}

        {/* AI History Tab */}
        {!searchQuery && activeTab === 'history' && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <History className="h-6 w-6 text-indigo-400" />
                AI Recommendation History
              </h2>
              {state.recommendationHistory && state.recommendationHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your recommendation history?')) {
                      clearHistory();
                    }
                  }}
                  className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
            {state.recommendationHistory && state.recommendationHistory.length > 0 ? (
              <div className="flex flex-col gap-8">
                {state.recommendationHistory.map((historyItem) => (
                  <div key={historyItem.id} className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6">
                    <div className="mb-6 flex items-center gap-2 text-sm text-zinc-400">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      Generated on {new Date(historyItem.date).toLocaleDateString()} at {new Date(historyItem.date).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {historyItem.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex flex-col rounded-xl bg-black/20 p-4 border border-white/5">
                          <h4 className="font-bold text-white mb-2">{rec.title}</h4>
                          <p className="text-sm text-zinc-400 italic">&quot;{rec.reason}&quot;</p>
                          <button
                            onClick={async () => {
                              const results = await searchManga(rec.title, 1, 1);
                              if (results.length > 0) setSelectedManga(results[0]);
                            }}
                            className="mt-4 self-start text-xs font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            View Details &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-zinc-400">
                <History className="mb-4 h-12 w-12 text-zinc-600" />
                <p>No recommendation history yet.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 text-indigo-400 hover:text-indigo-300"
                >
                  Generate some recommendations
                </button>
              </div>
            )}
          </section>
        )}
        {/* Dashboard Tab */}
        {!searchQuery && activeTab === 'dashboard' && state.aniListToken && (
          <section>
            <Dashboard onSelectMedia={handleSelectRelated} />
          </section>
        )}
      </main>

      {/* Modals */}
      {selectedManga && (
        <MangaDetailsModal
          manga={selectedManga}
          onClose={() => setSelectedManga(null)}
          onSelectRelated={handleSelectRelated}
        />
      )}
      
      {isPreferencesOpen && (
        <UserPreferencesModal
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl pb-safe">
        <div className="flex items-center justify-around px-2 py-3">
          <button
            onClick={() => { setActiveTab('discover'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'discover' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] font-medium">Discover</span>
          </button>
          <button
            onClick={() => { setActiveTab('mylist'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'mylist' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px] font-medium">My List</span>
          </button>
          <button
            onClick={() => { setActiveTab('history'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'history' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          {state.aniListToken && (
            <button
              onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
