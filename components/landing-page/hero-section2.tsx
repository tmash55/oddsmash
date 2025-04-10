"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Target,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ArrowRight,
  Zap,
  Smartphone,
  Eye,
  Brain,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

// Updated carouselItems array to use actual images from the landing-page directory
const carouselItems = [
  {
    id: "parlay-builder",
    title: "Build Smarter Parlays",
    description:
      "Compare odds across sportsbooks to maximize your parlay payouts",
    image: "/landing-page/parlay-builder.png",
    cta: "Try Parlay Builder",
    link: "/parlay-builder",
    color: "from-blue-500/20 to-blue-600/5",
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: "props-comparison",
    title: "Find the Best Prop Odds",
    description: "Shop for the best lines and never leave money on the table",
    image: "/landing-page/prop-table2.png",
    cta: "Compare Props",
    link: "/mlb/player-props",
    color: "from-emerald-500/20 to-emerald-600/5",
    icon: <Search className="h-5 w-5" />,
  },
  {
    id: "promo-calendar",
    title: "More Tools Coming Soon",
    description:
      "Track sportsbook promos in one place — no more missed offers or scrolling through apps.",
    image: "/landing-page/coming-soon.png", // Make sure to update the actual path
    cta: "View Promo Calendar",
    link: "/promo-calendar",
    color: "from-emerald-500/20 to-emerald-600/5",
    icon: <Calendar className="h-5 w-5" />,
  },
];

// Value proposition data
const valueProps = [
  {
    icon: <Eye className="h-6 w-6" />,
    title: "See Every Book's Line Instantly",
    description: "Avoid switching apps or tabs to shop lines.",
    color:
      "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Find the Sharpest Edges",
    description: "Our EV tech surfaces the best hidden value.",
    color:
      "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "One-Click Betslip Integration",
    description: "Auto-add your picks to supported books.",
    color:
      "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Modern & Mobile Friendly",
    description: "Fast, responsive tools built for every screen.",
    color:
      "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme } = useTheme();
  const intervalRef = useRef<number | null>(null);

  // Set visibility for animations
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const startCarousel = () => {
      intervalRef.current = window.setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % carouselItems.length);
      }, 7000);
    };

    startCarousel();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle manual carousel navigation
  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    // Reset interval when manually navigating
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % carouselItems.length);
      }, 7000);
    }
  };

  const activeItem = carouselItems[activeIndex];

  return (
    <section className="relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[length:30px_30px] opacity-10 dark:opacity-20"></div>

        {/* Gradient orbs - visible in both light and dark modes with different opacities */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 py-16 sm:py-24 mx-auto">
        {/* Main hero content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto mb-12 md:mb-16"
        >
          <div className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <TrendingUp className="w-3.5 h-3.5 mr-2 text-primary" />
            <span className="text-sm font-medium text-primary">
              Built for serious bettors, by serious bettors
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-jakarta">
            Stop Losing Value <br className="hidden sm:inline" />
            <span className="text-primary">On Your Bets.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Instantly compare prop and parlay odds — 100% free. Always bet with
            the best line.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-base font-medium px-8 h-12 group"
            >
              <Link href="/mlb/player-props">
                <Search className="mr-2 h-4 w-4" />
                Compare Props
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base font-medium px-8 h-12 group"
            >
              <Link href="/parlay-builder">
                <Target className="mr-2 h-4 w-4" />
                Build a Parlay
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Three-column check marks section */}
          <div className="hidden sm:flex flex-row justify-center gap-12 mt-12 max-w-3xl mx-auto">
            {[
              "Auto-Add to Betslip",
              "Compare Major Sportsbooks",
              "No More Missed Value",
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature carousel - Optimized for desktop while keeping one-column layout */}
        <div className="relative max-w-5xl mx-auto mt-12 md:mt-16">
          <div className="h-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div
                  className={cn(
                    "rounded-2xl overflow-hidden border backdrop-blur-sm h-full",
                    "border-primary/10 bg-gradient-to-br",
                    activeItem.color,
                    "dark:border-primary/20 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-950/90"
                  )}
                >
                  {/* Full-width image with optimized height for desktop */}
                  <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden border-b border-primary/20 dark:border-primary/10">
                    <Image
                      src={activeItem.image || "/placeholder.svg"}
                      alt={activeItem.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent pointer-events-none"></div>
                  </div>

                  {/* Text content below image - optimized for desktop */}
                  <div className="p-6 md:p-8 lg:p-10 max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 p-2.5 rounded-full bg-primary/10">
                        {activeItem.icon}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold">
                        {activeItem.title}
                      </h3>
                    </div>

                    <p className="text-lg md:text-xl mb-6 md:mb-8">
                      {activeItem.description}
                    </p>

                    <Button asChild size="lg" className="group">
                      <Link href={activeItem.link}>
                        {activeItem.cta}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel navigation dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
