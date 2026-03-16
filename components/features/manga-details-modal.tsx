'use client';

import React, { useState, useEffect } from 'react';
import { Manga } from '@/lib/anilist';
import { useUser, Rating } from '@/lib/user-context';
import { X, Heart, Star, BookOpen, Layers, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

import DOMPurify from 'isomorphic-dompurify';

interface MangaDetailsModalProps {
  manga: Manga | null;
  onClose: () => void;
  onSelectRelated?: (id: number) => void;
}

export function MangaDetailsModal({ manga, onClose, onSelectRelated }: MangaDetailsModalProps) {
  const { toggleLike, isLiked, rateManga, getRating } = useUser();

  const [quickPitch, setQuickPitch] = useState<string | null>(null);
  const [isFetchingPitch, setIsFetchingPitch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!manga) return null;

  const liked = isLiked(manga.id);
  const rating = getRating(manga.id);
  const title = manga.title.english || manga.title.romaji;
  const imageUrl = manga.coverImage.extraLarge || manga.coverImage.large;

  const handleRate = (r: Rating) => {
    rateManga(manga.id, r);
  };

  const handleGetPitch = async () => {
    setIsFetchingPitch(true);
    const res = await fetch('/api/quick-pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: manga.description || '' }),
    });
    if (!res.ok) throw new Error('Failed to fetch quick pitch');
    const { pitch } = await res.json();
    setQuickPitch(pitch);
    setIsFetchingPitch(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-3xl glass-panel shadow-2xl md:flex-row"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative h-64 w-full shrink-0 md:h-auto md:w-[40%]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Gradient overlay for mobile to make close button visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent md:hidden" />
          </div>

          <div className="flex flex-col p-6 md:p-10 w-full overflow-y-auto">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-300 uppercase">
                {manga.status}
              </span>
              {manga.format && (
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-300 uppercase">
                  {manga.format.replace(/_/g, ' ')}
                </span>
              )}
              {manga.source && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300 uppercase">
                  {manga.source.replace(/_/g, ' ')}
                </span>
              )}
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                {(manga.averageScore / 10).toFixed(1)}
              </span>
            </div>

            <h2 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
              {title}
            </h2>
            <p className="mb-6 text-sm text-zinc-400">
              {manga.title.native}
            </p>

            <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-8">
              {manga.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mb-8 flex items-center gap-6">
              {manga.episodes !== undefined && manga.episodes !== null ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Layers className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {manga.episodes || '?'} Episodes
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {manga.chapters || '?'} Chapters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Layers className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {manga.volumes || '?'} Volumes
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mb-6">
              {!quickPitch && !isFetchingPitch && (
                <button
                  onClick={handleGetPitch}
                  className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Get AI Quick Pitch
                </button>
              )}
              {isFetchingPitch && (
                <div className="flex items-center gap-2 text-sm text-indigo-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating pitch...
                </div>
              )}
              {quickPitch && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm font-medium text-indigo-200">
                  <div className="mb-2 flex items-center gap-2 text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Quick Pitch</span>
                  </div>
                  {quickPitch}
                </div>
              )}
            </div>

            <div
              className="prose prose-invert max-w-none text-zinc-300 mb-8 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(manga.description || 'No description available.') }}
            />

            {/* Relations */}
            {manga.relations && manga.relations.edges.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-white">Related Media</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {manga.relations.edges.map((edge) => (
                    <div
                      key={edge.node.id}
                      onClick={() => onSelectRelated && onSelectRelated(edge.node.id)}
                      className="flex w-32 shrink-0 flex-col gap-2 cursor-pointer group"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-800">
                        <Image
                          src={edge.node.coverImage.large || edge.node.coverImage.medium}
                          alt={edge.node.title.english || edge.node.title.romaji}
                          fill
                          sizes="128px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {edge.relationType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-white">
                          {edge.node.title.english || edge.node.title.romaji}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {manga.recommendations && manga.recommendations.nodes.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-white">Community Suggestions</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {manga.recommendations.nodes.map((rec) => (
                    <div
                      key={rec.mediaRecommendation.id}
                      onClick={() => onSelectRelated && onSelectRelated(rec.mediaRecommendation.id)}
                      className="flex w-32 shrink-0 flex-col gap-2 cursor-pointer group"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-800">
                        <Image
                          src={rec.mediaRecommendation.coverImage.large || rec.mediaRecommendation.coverImage.medium}
                          alt={rec.mediaRecommendation.title.english || rec.mediaRecommendation.title.romaji}
                          fill
                          sizes="128px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-300 line-clamp-2 group-hover:text-white">
                        {rec.mediaRecommendation.title.english || rec.mediaRecommendation.title.romaji}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-col gap-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(manga.id)}
                    className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                      liked
                        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${liked ? 'fill-rose-500' : ''}`}
                    />
                    {liked ? 'Liked' : 'Like'}
                  </button>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Your Rating
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star as Rating)}
                        className="group p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            rating && rating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-600 group-hover:text-amber-400/50'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
