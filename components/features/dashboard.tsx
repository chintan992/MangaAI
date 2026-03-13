'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { fetchUserDashboardData, fetchUserActivity } from '@/lib/anilist-dashboard';
import { Loader2, Tv, BookOpen, Clock, Star, Calendar, Activity, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { DashboardAIRecommendations } from '@/components/features/dashboard-ai-recommendations';

// Dynamically import the chart components to reduce initial bundle size
const DynamicChart = dynamic<any>(() => import('@/components/features/dashboard-chart').then(mod => mod.DashboardChart), {
  ssr: false,
  loading: () => <div className="h-48 w-full skeleton" />
});

export function Dashboard({ onSelectMedia }: { onSelectMedia?: (id: number) => void }) {
  const { state } = useUser();
  const [data, setData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!state.aniListToken || !state.aniListUser) return;
      
      try {
        setLoading(true);
        const [dashboardData, activityData] = await Promise.all([
          fetchUserDashboardData(state.aniListToken, state.aniListUser.id),
          fetchUserActivity(state.aniListToken, state.aniListUser.id)
        ]);
        
        setData(dashboardData);
        setActivities(activityData);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [state.aniListToken, state.aniListUser]);

  if (!state.aniListToken) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] text-zinc-400 backdrop-blur-sm">
        <Tv className="mb-4 h-12 w-12 text-zinc-600" />
        <p className="text-lg font-medium">Please log in with AniList to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading dashboard" className="space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-48 w-full rounded-[2rem] glass-panel" />
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-[2rem] glass-panel" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main List Skeleton */}
          <div className="space-y-8 lg:col-span-2">
            <div>
              <div className="mb-6 h-8 w-48 rounded-lg skeleton" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl glass-panel" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar Skeleton */}
          <div className="space-y-8">
            <div className="h-96 rounded-[2rem] glass-panel" />
            <div className="h-64 rounded-[2rem] glass-panel" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/5 text-rose-400 backdrop-blur-sm">
        <p className="font-medium">{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const { Viewer, currentAnime, currentManga } = data;
  const animeStats = Viewer.statistics.anime;
  const mangaStats = Viewer.statistics.manga;

  // Extract currently watching/reading
  const watching = currentAnime?.lists?.[0]?.entries || [];
  const reading = currentManga?.lists?.[0]?.entries || [];
  
  // Extract upcoming releases
  const upcoming = watching
    .filter((entry: any) => entry.media.nextAiringEpisode)
    .sort((a: any, b: any) => a.media.nextAiringEpisode.timeUntilAiring - b.media.nextAiringEpisode.timeUntilAiring)
    .slice(0, 5);

  // Chart data
  const chartData = [
    { name: 'Anime', value: animeStats.count, color: '#6366f1' },
    { name: 'Manga', value: mangaStats.count, color: '#ec4899' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Header Profile Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/50 shadow-2xl">
        {Viewer.bannerImage ? (
          <div className="absolute inset-0 z-0">
            <Image 
              src={Viewer.bannerImage} 
              alt="Banner" 
              fill 
              sizes="100vw"
              className="object-cover opacity-30 blur-sm" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-zinc-950" />
        )}
        
        <div className="relative z-10 flex flex-col items-center gap-6 p-8 pt-24 sm:flex-row sm:items-end sm:text-left text-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-950 shadow-2xl">
            <Image 
              src={Viewer.avatar.large} 
              alt={Viewer.name} 
              fill 
              sizes="112px"
              className="object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{Viewer.name}</h1>
            <p className="mt-1 text-sm font-medium uppercase tracking-widest text-zinc-400">AniList Dashboard</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard 
          icon={<Tv className="h-5 w-5 text-indigo-400" />}
          label="Anime Watched"
          value={animeStats.count}
          subValue={`${animeStats.episodesWatched} episodes`}
        />
        <StatCard 
          icon={<BookOpen className="h-5 w-5 text-pink-400" />}
          label="Manga Read"
          value={mangaStats.count}
          subValue={`${mangaStats.chaptersRead} chapters`}
        />
        <StatCard 
          icon={<Clock className="h-5 w-5 text-emerald-400" />}
          label="Time Watched"
          value={`${Math.round(animeStats.minutesWatched / 60 / 24)} days`}
          subValue={`${Math.round(animeStats.minutesWatched / 60)} hours`}
        />
        <StatCard 
          icon={<Star className="h-5 w-5 text-amber-400" />}
          label="Mean Score"
          value={animeStats.meanScore > 0 ? animeStats.meanScore : mangaStats.meanScore}
          subValue="Out of 100"
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Progress & Favorites */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Currently Watching */}
          {watching.length > 0 && (
            <motion.section variants={itemVariants}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                  <Tv className="h-6 w-6 text-indigo-400" />
                  Currently Watching
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {watching.slice(0, 4).map((entry: any) => (
                  <ProgressCard key={entry.id} entry={entry} type="anime" onClick={() => onSelectMedia?.(entry.media.id)} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Currently Reading */}
          {reading.length > 0 && (
            <motion.section variants={itemVariants}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                  <BookOpen className="h-6 w-6 text-pink-400" />
                  Currently Reading
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {reading.slice(0, 4).map((entry: any) => (
                  <ProgressCard key={entry.id} entry={entry} type="manga" onClick={() => onSelectMedia?.(entry.media.id)} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Favorites */}
          {(Viewer.favourites.anime.nodes.length > 0 || Viewer.favourites.manga.nodes.length > 0) && (
            <motion.section variants={itemVariants}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                  <Heart className="h-6 w-6 text-rose-400" />
                  Favorites
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {[...Viewer.favourites.anime.nodes, ...Viewer.favourites.manga.nodes].slice(0, 6).map((item: any) => (
                  <div 
                    key={item.id} 
                    className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-800 shadow-md cursor-pointer"
                    onClick={() => onSelectMedia?.(item.id)}
                  >
                    <Image 
                      src={item.coverImage.large} 
                      alt={item.title.english || item.title.romaji}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="absolute bottom-0 left-0 p-3 translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
                        <p className="text-xs font-bold leading-tight text-white line-clamp-2">
                          {item.title.english || item.title.romaji}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* Right Column: Activity & Upcoming & AI */}
        <div className="space-y-8">
          
          {/* AI Suggested for You */}
          <DashboardAIRecommendations 
            onSelectMedia={onSelectMedia} 
            favorites={[...Viewer.favourites.anime.nodes, ...Viewer.favourites.manga.nodes]} 
            current={[...watching, ...reading].map(e => e.media)} 
          />

          {/* Upcoming Releases */}
          {upcoming.length > 0 && (
            <motion.section variants={itemVariants} className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                <Calendar className="h-5 w-5 text-emerald-400" />
                Upcoming Releases
              </h2>
              <div className="space-y-3">
                {upcoming.map((entry: any) => {
                  const nextEp = entry.media.nextAiringEpisode;
                  const days = Math.floor(nextEp.timeUntilAiring / 86400);
                  const hours = Math.floor((nextEp.timeUntilAiring % 86400) / 3600);
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/10 cursor-pointer"
                      onClick={() => onSelectMedia?.(entry.media.id)}
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg shadow-sm">
                        <Image 
                          src={entry.media.coverImage.large} 
                          alt={entry.media.title.english || entry.media.title.romaji}
                          fill
                          sizes="40px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-emerald-300">
                          {entry.media.title.english || entry.media.title.romaji}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-zinc-400">
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-zinc-300">Ep {nextEp.episode}</span>
                          <span className="text-emerald-400">{days > 0 ? `${days}d ` : ''}{hours}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Recent Activity */}
          {activities.length > 0 && (
            <motion.section variants={itemVariants} className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                <Activity className="h-5 w-5 text-cyan-400" />
                Recent Activity
              </h2>
              <div className="space-y-0">
                {activities.map((activity: any, index: number) => (
                  <div 
                    key={activity.id} 
                    className={`relative pl-6 border-l border-white/10 pb-6 cursor-pointer group ${index === activities.length - 1 ? 'border-transparent pb-0' : ''}`}
                    onClick={() => onSelectMedia?.(activity.media.id)}
                  >
                    <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-transform group-hover:scale-150" />
                    <div className="flex items-start gap-4">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md shadow-sm">
                        <Image 
                          src={activity.media.coverImage.medium} 
                          alt={activity.media.title.english || activity.media.title.romaji}
                          fill
                          sizes="40px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-zinc-300">
                          <span className="font-semibold capitalize text-white">{activity.status}</span>
                          {' '}
                          {activity.progress ? <span className="text-zinc-400">{activity.progress} of </span> : ''}
                          <span className="font-medium text-indigo-300">{activity.media.title.english || activity.media.title.romaji}</span>
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                          {formatDistanceToNow(activity.createdAt * 1000, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Simple Chart */}
          <motion.section variants={itemVariants} className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
            <h2 className="mb-6 text-lg font-bold tracking-tight text-white">Library Breakdown</h2>
            <div className="h-48 w-full">
              <DynamicChart data={chartData} />
            </div>
          </motion.section>

        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:shadow-xl hover:border-white/10">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10" />
      <div className="mb-4 flex items-center gap-3 text-sm font-medium text-zinc-400">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 shadow-inner">
          {icon}
        </div>
        <span className="tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{value}</div>
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">{subValue}</div>
    </div>
  );
}

function ProgressCard({ entry, type, onClick }: { entry: any, type: 'anime' | 'manga', onClick?: () => void }) {
  const total = type === 'anime' ? entry.media.episodes : entry.media.chapters;
  const progress = entry.progress || 0;
  const percentage = total ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  
  return (
    <div 
      className="group relative flex gap-4 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl shadow-md">
        <Image 
          src={entry.media.coverImage.large} 
          alt={entry.media.title.english || entry.media.title.romaji}
          fill
          sizes="64px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <h4 className="mb-1 line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-indigo-300">
          {entry.media.title.english || entry.media.title.romaji}
        </h4>
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-zinc-400">
          <span>{progress} / {total || '?'} {type === 'anime' ? 'EP' : 'CH'}</span>
          <span>{percentage}%</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${type === 'anime' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
