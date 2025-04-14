"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

// Testimonial data
const testimonials = [
  {
    quote:
      "I used to place bets without checking. Now I check OddSmash first — the difference in payouts adds up fast.",
    author: "Chris D.",
    role: "Casual Bettor Turned Sharp",
    rating: 5,
  },
  {
    quote:
      "The parlay builder is exactly what I didn’t know I needed. Seeing odds across books? Game-changer.",
    author: "Alex G.",
    role: "Fantasy Sports Enthusiast",
    rating: 5,
  },
  {
    quote:
      "Clean interface. Easy to use. I’m excited to see where this goes — it's already super useful.",
    author: "Jordan P.",
    role: "trackkotc User & Early Access Tester",
    rating: 5,
  },
];

// Sportsbook data
const sportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "+ More"];

export function SocialProofSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Set visibility for animations when component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle testimonial navigation
  const nextTestimonial = useCallback(() => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setActiveTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 8000);
    return () => clearInterval(interval);
  }, [nextTestimonial]);

  return (
    <section className="py-10 md:py-20 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
            transition={{ duration: 0.5 }}
            className="mb-8 md:mb-12"
          >
            <h2 className="text-xl md:text-3xl font-bold">
              Trusted by <span className="text-primary">10,000+</span> bettors —
              and growing fast.
            </h2>
            <p className="text-xs text-muted-foreground mt-2">
              These testimonials were collected from users of our previous tool
              (TrackKOTC.com) and early testers of OddSmash.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left side: Featured review and sportsbooks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Featured 5-star review */}
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 md:p-7 hover:border-primary/30 transition-all duration-300 shadow-sm">
                <div className="flex mb-3 md:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-base md:text-lg font-medium mb-3 md:mb-4">
                  &quot;OddSmash saves me so much time. No more bouncing between
                  apps — I see all the odds I need in one spot.&quot;
                </p>
                <p className="text-sm md:text-base font-medium">Tyler M.</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Early Beta Tester
                </p>
              </div>

              {/* Sportsbook logos with improved visibility */}
              <div className="bg-card border border-border rounded-xl p-5 md:p-7 shadow-sm">
                <p className="text-sm md:text-base font-medium mb-4 md:mb-5">
                  Compare odds across major sportsbooks:
                </p>
                <div className="flex flex-wrap gap-3 md:gap-4 items-center">
                  {sportsbooks.map((book, i) => (
                    <div
                      key={i}
                      className="h-9 md:h-10 px-3 md:px-4 bg-primary/5 border border-primary/10 rounded-md flex items-center justify-center hover:bg-primary/10 transition-all duration-300"
                    >
                      <div className="text-xs md:text-sm font-medium">
                        {book}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right side: Testimonial slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 md:p-7 hover:border-primary/30 transition-all duration-300 min-h-[280px] md:min-h-[320px] flex flex-col shadow-sm">
                <div className="text-primary mb-3 md:mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={isMobile ? "36" : "48"}
                    height={isMobile ? "36" : "48"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-20"
                  >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                  </svg>
                </div>

                {/* Content area with fixed height to prevent overlap */}
                <div className="flex-1 flex flex-col">
                  {/* Testimonial content with proper spacing */}
                  <div className="flex-1 mb-8 md:mb-12 relative">
                    {testimonials.map((testimonial, index) => (
                      <div
                        key={index}
                        className={cn(
                          "absolute inset-0 transition-opacity duration-500",
                          index === activeTestimonial
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        )}
                      >
                        <p className="text-base md:text-lg mb-4 md:mb-6">
                          {testimonial.quote}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm md:text-base">
                              {testimonial.author}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {testimonial.role}
                            </p>
                          </div>
                          <div className="flex">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation controls in fixed position at bottom */}
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex space-x-1">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTestimonial(index)}
                          className={cn(
                            "w-1.5 md:w-2 h-1.5 md:h-2 rounded-full transition-all duration-300",
                            index === activeTestimonial
                              ? "bg-primary w-4 md:w-6"
                              : "bg-primary/30"
                          )}
                          aria-label={`Go to testimonial ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex space-x-1 md:space-x-2">
                      <button
                        onClick={prevTestimonial}
                        className="p-1 rounded-full hover:bg-primary/10 transition-colors"
                        aria-label="Previous testimonial"
                      >
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                      <button
                        onClick={nextTestimonial}
                        className="p-1 rounded-full hover:bg-primary/10 transition-colors"
                        aria-label="Next testimonial"
                      >
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center md:hidden">
                    These testimonials were collected from users of our previous
                    tool (TrackKOTC.com) and early testers of OddSmash.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
