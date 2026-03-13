'use client';

import React from 'react';
import { Logo } from '@/components/layout/logo';
import Link from 'next/link';
import { Github, Twitter, MessageSquare, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  type FooterLink = { name: string; href: string; icon?: React.ReactNode };
  const footerLinks: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Platform',
      links: [
        { name: 'Dashboard', href: '/' },
        { name: 'Library', href: '/library' },
        { name: 'Anime', href: '/anime' },
        { name: 'Manga', href: '/manga' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Discord', href: '#', icon: <MessageSquare className="h-4 w-4" /> },
        { name: 'Twitter / X', href: '#', icon: <Twitter className="h-4 w-4" /> },
        { name: 'GitHub', href: 'https://github.com', icon: <Github className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Contact Us', href: '#' },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-white/5 bg-zinc-950/80 pb-safe pb-24 md:pb-8 pt-16 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:gap-8">
          
          {/* Brand & Description */}
          <div className="col-span-1 space-y-6 md:col-span-1">
            <Logo size="md" />
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
              The ultimate tracking and recommendation engine for passionate anime and manga consumers. Powered by AI.
            </p>
            
            {/* AniList Attribution */}
            <a 
              href="https://anilist.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-indigo-400"
            >
              <span>Powered by AniList API</span>
              <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Links Sections */}
          <div className="col-span-1 grid grid-cols-2 gap-8 md:col-span-3 sm:grid-cols-3">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">
                  {section.title}
                </h3>
                <ul className="space-y-3 pl-0"> {/* Reset ol/ul padding if prose is leaking */}
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href} 
                        className="group flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-indigo-400"
                      >
                        {link.icon && (
                          <span className="text-zinc-600 transition-colors group-hover:text-indigo-400">
                            {link.icon}
                          </span>
                        )}
                        <span>{link.name}</span>
                        
                        {/* Interactive Underline */}
                        <span className="relative overflow-hidden w-0 text-transparent transition-all duration-300 group-hover:w-full">
                          _
                          <span className="absolute bottom-1 left-0 h-px w-full bg-indigo-400/50" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-zinc-600 sm:flex-row">
          <p>© {currentYear} MangaAI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              Made with <motion.span animate={{ scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 2 } }} className="text-rose-500">♥</motion.span> by MangaAI Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
