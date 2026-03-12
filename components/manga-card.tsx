'use client';

import React from 'react';
import { Manga } from '@/lib/anilist';
import { useUser, Rating } from '@/lib/user-context';
import { Heart, Star } from 'lucide-react';
import Image from 'next/image';

interface MangaCardProps {
  manga: Manga;
  onClick: (manga: Manga) => void;
  compact?: boolean;
}

export function MangaCard({ manga, onClick, compact = false }: MangaCardProps) {
  const { isLiked, getRating, toggleLike } = useUser();
  const liked = isLiked(manga.id);
  const rating = getRating(manga.id);

  const title = manga.title.english || manga.title.romaji;
  const imageUrl = manga.coverImage.large || manga.coverImage.medium;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(manga.id);
  };

  return (
    <div
      className="group relative w-full aspect-[2/3] overflow-hidden rounded-2xl bg-[#0a0a0a] cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:-translate-y-2 border border-white/5 hover:border-indigo-500/30"
      onClick={() => onClick(manga)}
    >
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 lg:group-hover:scale-110 lg:group-hover:rotate-1"
        referrerPolicy="no-referrer"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 opacity-80 transition-opacity duration-500 lg:group-hover:opacity-100" />

      {/* Top Bar (Rating & Like) */}
      {!compact && (
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          <div className="flex flex-col gap-1">
            {manga.averageScore ? (
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/10 shadow-lg">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold text-white tracking-wide">
                  {(manga.averageScore / 10).toFixed(1)}
                </span>
              </div>
            ) : (
              <div />
            )}
          </div>
          <button
            onClick={handleLikeClick}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 border shadow-lg ${
              liked 
                ? 'bg-rose-500/20 border-rose-500/30' 
                : 'bg-black/60 border-white/10 hover:bg-rose-500/20 hover:border-rose-500/30'
            }`}
          >
            <Heart className={`h-4 w-4 transition-colors ${liked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>
        </div>
      )}

      {/* Bottom Content (Title & Genres Reveal) */}
      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-0 lg:translate-y-6 transition-transform duration-500 lg:group-hover:translate-y-0">
          <h3 className="text-base font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
            {title}
          </h3>
          {manga.title.native && (
            <p className="mt-1 text-xs text-zinc-400 line-clamp-1 font-medium drop-shadow-md">
              {manga.title.native}
            </p>
          )}

          {/* Reveal on hover on desktop, always visible on mobile */}
          <div className="mt-3 flex flex-wrap gap-1.5 opacity-100 lg:opacity-0 transition-all duration-500 lg:group-hover:opacity-100">
            {manga.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-200 backdrop-blur-md border border-white/10 shadow-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
