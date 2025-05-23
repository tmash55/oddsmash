'use client';

import { motion } from 'framer-motion';

const COLUMN_DATA = [
  // Column 1 - Slowest
  [
    { title: 'Hit Rate Analytics', description: 'Track your success rate across different bet types' },
    { title: 'Performance Insights', description: 'Deep dive into your betting patterns' },
    { title: 'Historical Data', description: 'View past performance and trends' },
    { title: 'Custom Reports', description: 'Generate detailed betting reports' },
  ],
  // Column 2
  [
    { title: 'Quick Hits Dashboard', description: 'Real-time betting opportunities' },
    { title: 'Value Finder', description: 'Identify the best odds across books' },
    { title: 'Streak Analyzer', description: 'Track player and team streaks' },
    { title: 'Smart Alerts', description: 'Get notified of prime betting moments' },
  ],
  // Column 3 - Middle speed
  [
    { title: 'Prop Builder', description: 'Create custom prop bet combinations' },
    { title: 'Odds Comparison', description: 'Compare odds across major sportsbooks' },
    { title: 'Win Probability', description: 'AI-powered success predictions' },
    { title: 'Trend Spotting', description: 'Identify emerging betting patterns' },
  ],
  // Column 4
  [
    { title: 'Live Tracking', description: 'Monitor your active bets in real-time' },
    { title: 'Portfolio Analysis', description: 'Review your betting portfolio' },
    { title: 'ROI Calculator', description: 'Track your return on investment' },
    { title: 'Risk Assessment', description: 'Smart bet sizing recommendations' },
  ],
  // Column 5 - Fastest
  [
    { title: 'Market Movement', description: 'Track line movements and shifts' },
    { title: 'Arbitrage Finder', description: 'Identify guaranteed profit opportunities' },
    { title: 'Correlation Engine', description: 'Find related betting opportunities' },
    { title: 'Smart Parlay Builder', description: 'Build data-driven parlays' },
  ],
];

const ScrollingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A0A0A]">
      <div className="flex h-full gap-4 px-4">
        {COLUMN_DATA.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="relative flex-1 overflow-hidden"
          >
            <motion.div
              initial={{ y: '0%' }}
              animate={{ y: '-50%' }}
              transition={{
                duration: 50 + columnIndex * 5,
                repeat: Infinity,
                ease: 'linear',
                repeatType: 'loop',
              }}
              className="flex flex-col gap-4 py-4"
            >
              {[...column, ...column, ...column].map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  className="rounded-lg border border-[#27272A]/20 bg-[#18181B]/60 p-4 backdrop-blur-none transition-all duration-300 hover:border-blue-500/20 hover:bg-[#27272A]/70"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <h3 className="mb-1 text-sm font-medium text-white/90">
                    {card.title}
                  </h3>
                  <p className="text-xs text-white/60">
                    {card.description}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Gradient overlays for smooth fade effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent" />
    </div>
  );
};

export default ScrollingBackground; 