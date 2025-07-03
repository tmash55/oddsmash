'use client';

import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === '/onboarding';

  // For onboarding, use a simple full-screen layout
  if (isOnboarding) {
    return (
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>
    );
  }

  // For other auth pages (sign-in, sign-up), use the constrained layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Subtle branded background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-500/20 dark:from-green-400/10 dark:to-emerald-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Secondary gradient orb */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 dark:from-blue-400/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse-medium"></div>
        
        {/* Accent gradient orb */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-300/10 to-blue-300/10 dark:from-green-300/5 dark:to-blue-300/5 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Subtle dot pattern - simplified */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>

      {/* Content layer */}
      <div className="h-full flex items-center justify-center py-0 px-0 md:py-12 md:px-4 relative z-10">
        {/* Header with logo and social - Hidden on mobile */}
        <header className="absolute top-0 w-full px-4 py-4 justify-between items-center hidden md:flex z-20">
          <Link href="/" className="flex items-center justify-center w-12 h-12 group">
            <div className="relative">
              <Image
                src="/icon.png"
                alt="OddSmash Logo"
                width={48}
                height={48}
                className="hover:opacity-80 transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
                priority
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </Link>

          <Link 
            href="https://x.com/OddSmashApp" 
            target="_blank"
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-white/80 dark:hover:text-white transition-all duration-300 group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
          </Link>
        </header>

        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>
    </div>
  );
}
