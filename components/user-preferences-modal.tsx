'use client';

import React, { useState } from 'react';
import { useUser } from '@/lib/user-context';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ALL_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserPreferencesModal({ isOpen, onClose }: UserPreferencesModalProps) {
  const { state, updatePreferences } = useUser();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(state.preferences.favoriteGenres);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSave = () => {
    updatePreferences({ favoriteGenres: selectedGenres });
    onClose();
  };

  if (!isOpen) return null;

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
          className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl border border-white/10"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-6 shrink-0">
            <h2 className="text-2xl font-bold tracking-tight text-white">Your Preferences</h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto">
            <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
              Select your favorite genres to help our AI engine tailor recommendations specifically for you.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {ALL_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {genre}
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-white/10 bg-zinc-950/50 p-6 shrink-0">
            <button
              onClick={onClose}
              className="mr-4 rounded-xl px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40"
            >
              Save Preferences
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
