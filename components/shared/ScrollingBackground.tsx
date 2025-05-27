'use client';

import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';

const COLUMN_DATA = [
  // Column 1 - Core Features
  [
    { 
      title: 'Hit Rate Analytics',
      description: 'Advanced player performance tracking with intuitive visualizations and instant odds comparison',
      image: '/images/features/hitrate-dashboard1.png'
    },
    { 
      title: 'Quick Hits Dashboard',
      description: 'Access trending picks and analysis from top cappers, updated in real-time',
      image: '/images/features/quickhit-dashboard1.png'
    },
    { 
      title: 'Prop Line Comparison',
      description: 'Compare prop betting lines across all major sportsbooks in one streamlined view',
      image: '/images/features/hitrate-card1.png'
    },
  ],
  // Column 2 - Tools
  [
    { 
      title: 'Parlay Builder',
      description: 'Find the best parlay odds instantly by comparing across multiple sportsbooks',
      image: '/images/features/hitrate-card2.png'
    },
    { 
      title: 'SmashBoard™ (Coming Soon)',
      description: 'All-new comprehensive dashboard for the ultimate betting command center',
      image: '/images/features/hitrate-card3.png'
    },
    { 
      title: 'Data Duels (Coming Soon)',
      description: 'Deep dive into game-by-game matchup analysis with advanced statistics',
      image: '/images/features/hitrate-card4.png'
    },
  ],
  // Column 3 - Innovation
  [
    { 
      title: 'AI Assistant (Coming Soon)',
      description: 'Chat with our AI to get instant access to custom data analysis and insights',
      image: '/images/features/hitrate-card5.png'
    },
    { 
      title: 'Historical Analysis',
      description: 'Track performance trends and identify winning patterns over time',
      image: '/images/features/hitrate-card6.png'
    },
    { 
      title: 'Value Finder',
      description: 'Instantly spot the best odds and highest value opportunities',
      image: '/images/features/hitrate-card7.png'
    },
  ],
  // Column 4 - Insights
  [
    { 
      title: 'Performance Dashboard',
      description: 'Your complete betting portfolio with detailed success metrics',
      image: '/images/features/hitrate-dashboard2.png'
    },
    { 
      title: 'Smart Alerts',
      description: 'Get notified when optimal betting opportunities arise',
      image: '/images/features/hitrate-card8.png'
    },
    { 
      title: 'Quick Stats',
      description: 'Essential betting data and trends at your fingertips',
      image: '/images/features/quickhit-card1.png'
    },
  ],
];

const ScrollingBackground = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // Determine how many columns to show based on screen size
  const columnsToShow = isMobile ? 2 : isTablet ? 3 : 4;
  
  // Reorganize data for mobile view (2 columns)
  const reorganizedData = (() => {
    if (columnsToShow === 2) {
      // For mobile, combine columns into 2, maintaining order
      return [
        [...COLUMN_DATA[0], ...COLUMN_DATA[1]].slice(0, 3), // First mobile column
        [...COLUMN_DATA[2], ...COLUMN_DATA[3]].slice(0, 3), // Second mobile column
      ];
    } else if (columnsToShow === 3) {
      // For tablet, use first 3 columns
      return COLUMN_DATA.slice(0, 3);
    }
    return COLUMN_DATA; // Desktop shows all columns
  })();

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A0A0A]">
      <div className="flex h-full gap-4 px-4 md:gap-6 md:px-6">
        {reorganizedData.map((column, columnIndex) => {
          // Calculate initial offset for each column
          const initialOffset = (() => {
            if (columnsToShow === 2) {
              // More pronounced offset for 2 columns
              return columnIndex === 0 ? '0%' : '-25%';
            }
            // Regular offset pattern for 3-4 columns
            switch(columnIndex) {
              case 0: return '0%';
              case 1: return '-15%';
              case 2: return '-30%';
              case 3: return '-45%';
              default: return '0%';
            }
          })();

          return (
            <div
              key={columnIndex}
              className="relative flex-1 overflow-hidden"
            >
              <motion.div
                initial={{ y: initialOffset }}
                animate={{ y: `calc(${initialOffset} - 50%)` }}
                transition={{
                  duration: (() => {
                    if (isMobile) {
                      // Faster speeds for mobile, maintaining parallax effect
                      return columnIndex === 0 ? 180 : // Fastest
                             columnIndex === 2 ? 200 : // Fast
                             240; // Normal speed
                    }
                    // Desktop speeds
                    return columnIndex === 0 ? 280 : // Fastest
                           columnIndex === 2 ? 300 : // Fast
                           360; // Normal speed
                  })(),
                  repeat: Infinity,
                  ease: 'linear',
                  repeatType: 'loop',
                  repeatDelay: 0,
                }}
                className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
              >
                {[...column, ...column, ...column, ...column, ...column].map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="relative overflow-hidden rounded-lg border border-[#27272A]/20 bg-[#18181B]/60 backdrop-blur-none transition-all duration-300 hover:border-blue-500/20 hover:bg-[#27272A]/70"
                    style={{
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      aspectRatio: isMobile ? '2/2.5' : '2/3', // Slightly shorter cards on mobile
                    }}
                  >
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt={card.title}
                        className="h-full w-full object-contain bg-[#18181B]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#18181B]/80 to-[#18181B]" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                      <h3 className="mb-1 text-xs font-medium text-white/90 md:text-sm">
                        {card.title}
                      </h3>
                      <p className="text-[10px] text-white/60 md:text-xs">
                        {card.description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Gradient overlays for smooth fade effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 md:h-40 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent" />
    </div>
  );
};

export default ScrollingBackground; 