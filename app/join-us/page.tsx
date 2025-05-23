'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ScrollingBackground from './components/scrolling-background';

export default function JoinUs() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

      toast({
        title: 'Success! 🎉',
        description: 'You have successfully joined the waitlist. We will notify you when the features are live!',
      });
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

  return (
    <div className="relative h-full w-full bg-[#0A0A0A]">
      <ScrollingBackground />

      {/* Gradient Blur Overlay - Middle Layer */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent backdrop-blur-[1px]" />

      {/* Content Card - Top Layer */}
      <div className="relative z-20 flex h-full items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md rounded-2xl bg-[#18181B]/40 p-8 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(to bottom right, rgba(24,24,27,0.7), rgba(24,24,27,0.4))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            Join the Waitlist
          </h1>
          <p className="mb-8 text-center text-gray-300">
            Be among the first to experience our new Hit Rate and Quick Hits features
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-white/10 bg-[#27272A]/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                required
              />
            </div>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-medium text-white transition-all hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Waitlist'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 