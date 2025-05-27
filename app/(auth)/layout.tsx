'use client';

import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import ScrollingBackground from '@/components/shared/ScrollingBackground';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-[#0A0A0A]">
      {/* Background layers */}
      <div className="fixed inset-0">
        <ScrollingBackground />
        
        {/* Gradient Blur Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-transparent backdrop-blur-[1.5px]" />
        </div>
      </div>

      {/* Content layer */}
      <div className="relative h-full flex items-center justify-center">
        {/* Header with logo and social */}
        <header className="absolute top-0 w-full px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center justify-center w-10 h-10">
            <Image
              src="/icon.png"
              alt="OddSmash Logo"
              width={40}
              height={40}
              className="hover:opacity-80 transition-opacity"
              priority
            />
          </Link>

          <Link 
            href="https://x.com/OddSmashApp" 
            target="_blank"
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <span className="text-sm hidden sm:inline">Follow for updates</span>
            <div className="w-10 h-10 flex items-center justify-center">
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
