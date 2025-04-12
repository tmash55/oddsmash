"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, DollarSign, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Steps data
  const steps = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Compare Props or Parlays",
      description: "Instantly see odds from all major sportsbooks in one place",
      color: "bg-blue-500 text-white",
      shadowColor: "shadow-blue-500/20",
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Choose the Best Odds",
      description:
        "Find the highest payouts and best lines with highlighted values",
      color: "bg-emerald-500 text-white",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      icon: <ExternalLink className="h-6 w-6" />,
      title: "Auto-Add to Betslip",
      description:
        "One click sends you directly to the sportsbook with your bet ready",
      color: "bg-amber-500 text-white",
      shadowColor: "shadow-amber-500/20",
    },
  ];

  // Intersection Observer to trigger animations when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Auto-advance steps for animation
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible, steps.length]);

  return (
    <section
      ref={containerRef}
      className="py-16 md:py-24 bg-background relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] md:bg-[length:30px_30px] opacity-10 dark:opacity-20"></div>

        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Get better odds in three simple steps — no account required
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mb-12 md:mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 30,
                scale: activeStep === index ? 1.03 : 1,
              }}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.1,
                scale: { duration: 0.3 },
              }}
              className={cn(
                "relative rounded-xl border bg-card p-6 md:p-8 transition-all duration-300",
                activeStep === index
                  ? "border-primary/30 shadow-lg"
                  : "border-border"
              )}
            >
              {/* Step number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-lg",
                  step.color,
                  step.shadowColor
                )}
              >
                {step.icon}
              </div>

              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-10"
        >
          <Button asChild size={isMobile ? "default" : "lg"} className="group">
            <Link href="mlb/player-props">
              Try It Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
