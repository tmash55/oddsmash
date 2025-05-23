'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ScrollingBackground from './components/scrolling-background';
import Link from 'next/link';
import Image from 'next/image';

interface SuccessAnimationProps {
  onReset: () => void;
}

const SuccessAnimation = ({ onReset }: SuccessAnimationProps) => (
  <motion.div 
    className="absolute inset-0 flex flex-col items-center justify-center"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5 }}
  >
    {/* Success checkmark */}
    <motion.div
      className="relative h-20 w-20 mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-green-500/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-green-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.svg
          className="absolute inset-0 h-full w-full text-green-500"
          viewBox="0 0 32 32"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.path
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16.5L13 21.5L24 10.5"
          />
        </motion.svg>
      </motion.div>
    </motion.div>

    {/* Success text */}
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <h2 className="text-2xl font-bold text-white/90 mb-2">You&apos;re on the list! 🎉</h2>
      <p className="text-gray-300/90 mb-8">We&apos;ll notify you when the features are live.</p>
      
      <div className="flex flex-col gap-3">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onReset}
          className="w-full rounded-lg bg-white/20 py-2 px-4 text-sm text-white hover:bg-white/30 transition-colors"
        >
          Submit another email
        </motion.button>
        
        <Link href="/" className="w-full">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="w-full rounded-lg bg-gradient-to-r from-blue-500/80 to-purple-600/80 py-2 px-4 text-sm text-white hover:from-blue-500/90 hover:to-purple-600/90 transition-colors"
          >
            View current features
          </motion.button>
        </Link>
      </div>
    </motion.div>

    {/* Confetti particles */}
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute h-2 w-2"
        initial={{
          opacity: 1,
          scale: 0,
          x: 0,
          y: 0,
        }}
        animate={{
          opacity: 0,
          scale: 1,
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          rotate: Math.random() * 360,
        }}
        transition={{
          duration: 1,
          delay: 0.3 + i * 0.05,
          ease: "easeOut",
        }}
        style={{
          background: i % 2 === 0 ? '#3B82F6' : '#9333EA',
          borderRadius: '50%',
        }}
      />
    ))}
  </motion.div>
);

export default function JoinUs() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const { toast } = useToast();

  // Start pulse animation after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldPulse(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Simulated progress - this could come from your API
  const progressPercentage = 82; // 82% full

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSuccess(true);
      setEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
  };

  return (
    <div className="relative h-full w-full bg-[#0A0A0A]">
      {/* Icon in top left corner */}
      <Link href="/" className="absolute top-4 left-4 z-30 flex items-center justify-center w-10 h-10">
        <Image
          src="/icon.png"
          alt="OddSmash Logo"
          width={40}
          height={40}
          className="hover:opacity-80 transition-opacity"
          priority
        />
      </Link>

      {/* X (Twitter) link in top right corner */}
      <Link 
        href="https://x.com/oddsmash" 
        target="_blank"
        rel="noopener noreferrer" 
        className="absolute top-4 right-4 z-30 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <span className="text-sm hidden sm:inline">Follow for updates</span>
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </Link>

      <ScrollingBackground />

      {/* Gradient Blur Overlay - Middle Layer */}
      <div className="absolute inset-0 z-10">
        {/* Base gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-transparent backdrop-blur-[1.5px]" />
        
        {/* Vignette effect - lighter version */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Content Card - Top Layer */}
      <div className="relative z-20 flex h-full items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={`relative w-full max-w-md rounded-2xl ${!isSuccess ? 'bg-[#18181B]/40 backdrop-blur-xl' : ''} p-8 pb-16`}
          style={{
            background: isSuccess ? 'transparent' : 'linear-gradient(135deg, rgba(24,24,27,0.4), rgba(24,24,27,0.3))',
            boxShadow: isSuccess ? 'none' : '0 8px 32px rgba(0,0,0,0.3)',
            border: isSuccess ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <SuccessAnimation onReset={handleReset} />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="mb-2 text-center text-3xl font-bold text-white/90">
                  Join the Waitlist
                </h1>
                <p className="mb-4 text-center text-gray-300/90">
                  Be among the first to experience our new Hit Rate and Quick Hits features
                </p>

                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="h-1.5 w-full bg-gray-700/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-purple-400/90 font-medium text-center">
                    Limited spots remaining — Join now!
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-lg border border-white/5 bg-[#27272A]/30 px-4 py-3 text-white placeholder-gray-400/80 backdrop-blur-sm transition-all duration-300 
                        focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-[#18181B]"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-400/80 text-center">
                    We&apos;ll only email you about feature launches. No spam, ever.
                    </p>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={shouldPulse ? {
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0)',
                        '0 0 0 8px rgba(59, 130, 246, 0)',
                        '0 0 0 0 rgba(59, 130, 246, 0)'
                      ],
                    } : {}}
                    transition={shouldPulse ? {
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    } : {}}
                    className="relative w-full rounded-lg bg-gradient-to-r from-blue-500/90 to-purple-600/90 py-3 font-medium text-white/95 
                      transition-all hover:from-blue-600/90 hover:to-purple-700/90 disabled:opacity-50"
                  >
                    {isLoading ? 'Joining...' : 'Join Waitlist'}
                  </motion.button>
                </form>

                {/* Card shadow pulse animation */}
                <motion.div
                  className="absolute inset-0 -z-10 rounded-2xl pointer-events-none"
                  animate={shouldPulse ? {
                    boxShadow: [
                      '0 8px 32px rgba(0,0,0,0.3)',
                      '0 8px 32px rgba(59, 130, 246, 0.2)',
                      '0 8px 32px rgba(0,0,0,0.3)'
                    ],
                  } : {}}
                  transition={shouldPulse ? {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  } : {}}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
} 