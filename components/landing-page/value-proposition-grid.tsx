"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Brain, Zap, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";

// Value proposition data
const valueProps = [
  {
    icon: <Eye className="h-5 w-5 md:h-6 md:w-6" />,
    title: "See Every Book's Line Instantly",
    description: "Avoid switching apps or tabs to shop lines.",
    color:
      "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    icon: <Brain className="h-5 w-5 md:h-6 md:w-6" />,
    title: "Find the Sharpest Edges",
    description: "Our EV tech surfaces the best hidden value.",
    color:
      "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    icon: <Zap className="h-5 w-5 md:h-6 md:w-6" />,
    title: "One-Click Betslip Integration",
    description: "Auto-add your picks to supported books.",
    color:
      "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
  },
  {
    icon: <Smartphone className="h-5 w-5 md:h-6 md:w-6" />,
    title: "Modern & Mobile Friendly",
    description: "Fast, responsive tools built for every screen.",
    color:
      "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
];

export function ValuePropositionGrid() {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Set visibility for animations when component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="py-12 md:py-20 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] md:bg-[length:30px_30px] opacity-10 dark:opacity-20"></div>

        {/* Subtle gradient background */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent"></div>
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">
            Why Bettors Choose OddSmash
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Our platform is designed to give you an edge with every bet you
            place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 md:p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div
                className={cn(
                  "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 md:mb-4",
                  prop.color
                )}
              >
                {prop.icon}
              </div>
              <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">
                {prop.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 md:mt-12 text-center">
          <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/5 border border-primary/10 mb-4 md:mb-6">
            <span className="text-xs md:text-sm font-medium">
              <span className="text-primary font-bold">14.2%</span> better odds
              on average, saving{" "}
              <span className="text-primary font-bold">$142.60</span> per $1000
              bet
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
