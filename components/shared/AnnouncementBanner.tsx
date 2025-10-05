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
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-500/90 via-purple-600/90 to-blue-500/90 text-white shadow-lg backdrop-blur-sm"
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline">🎯</span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
            <p className="text-sm font-medium">
              <span className="hidden sm:inline">Create a free account to access </span>
              <span className="font-semibold">Hit Rates & Hit Sheets</span>
            </p>
            <p className="text-xs sm:text-sm text-white/80 sm:inline">
              <span className="hidden sm:inline">— </span>
              <span>Turn data into winning picks</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/sign-up" 
            className="text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors hidden sm:inline-block"
          >
            Get Started →
          </Link>
          <Link 
            href="/sign-up" 
            className="text-sm font-medium hover:text-white/90 sm:hidden"
          >
            Sign Up →
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