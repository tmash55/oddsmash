// app/auth/components/AuthCard.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8 }}
      className="relative w-full max-w-md rounded-2xl p-8 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(24,24,27,0.7), rgba(24,24,27,0.4))',
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.2),
          0 0 0 1px rgba(255,255,255,0.1)
        `,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
