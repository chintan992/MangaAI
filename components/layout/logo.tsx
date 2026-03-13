'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export function Logo({ className, size = 'md', withText = true }: LogoProps) {
  // Size variants
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-xl', container: 'gap-1.5' },
    md: { icon: 'w-6 h-6', text: 'text-2xl', container: 'gap-2' },
    lg: { icon: 'w-8 h-8', text: 'text-3xl', container: 'gap-3' },
  };

  const { icon, text, container } = sizes[size];

  return (
    <Link href="/">
      <motion.div 
        className={cn(`group relative flex items-center font-display font-bold text-white`, container, className)}
        whileHover="hover"
        whileTap="tap"
        initial="initial"
        animate="animate"
      >
        {/* Glow backdrop that pops on hover */}
        <motion.div
          className="absolute -inset-2 z-0 rounded-full bg-indigo-500/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
          variants={{
            hover: { scale: 1.2, opacity: 1 },
            tap: { scale: 0.9, opacity: 0.5 }
          }}
        />

        {/* Animated Icon Container */}
        <motion.div 
          className="relative z-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 shadow-lg shadow-indigo-500/25"
          variants={{
            initial: { rotate: -10, scale: 0.9 },
            animate: { rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 12 } },
            hover: { 
              rotate: [0, -15, 10, -5, 0],
              scale: 1.1,
              transition: { duration: 0.5, ease: "easeInOut" }
            },
            tap: { scale: 0.9 }
          }}
        >
          <BookOpen className={cn("text-white", icon)} strokeWidth={2.5} />
          
          {/* Subtle sparkles that pop out on hover */}
          <motion.div 
            className="absolute -right-2 -top-2"
            variants={{
              initial: { opacity: 0, scale: 0, rotate: -45 },
              hover: { 
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0.8],
                rotate: 45,
                transition: { duration: 0.8, repeat: Infinity, repeatDelay: 1 } 
              }
            }}
          >
            <Sparkles className="h-3 w-3 text-pink-300" />
          </motion.div>
        </motion.div>

        {/* Text Logo */}
        {withText && (
          <div className="relative z-10 flex items-baseline">
            <span className={cn("tracking-tight", text)}>Manga</span>
            <motion.span 
              className={cn("bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent", text)}
              variants={{
                hover: { 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  transition: { duration: 2, ease: "linear", repeat: Infinity }
                }
              }}
              style={{ backgroundSize: '200% auto' }}
            >
              AI
            </motion.span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
