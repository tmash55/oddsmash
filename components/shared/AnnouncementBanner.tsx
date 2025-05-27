import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-600/90 via-blue-500/90 to-blue-600/90 text-white shadow-lg backdrop-blur-sm"
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
    <div className="flex items-center space-x-2">
      <span className="hidden sm:inline">📊</span>
      <p className="text-sm font-medium">
        <span className="hidden sm:inline">Unlock </span>
        <span className="font-semibold">Hit Rate Analytics</span>
        <span className="hidden sm:inline">
          —compare player trends, spot value bets, and turn data into wins
        </span>
      </p>
    </div>
    <div className="flex items-center space-x-4">
      <Link href="/hit-rates" className="text-sm font-medium hover:text-blue-100 underline-offset-4 hover:underline hidden sm:inline-block">
        Explore now →
      </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white focus:outline-none"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
} 