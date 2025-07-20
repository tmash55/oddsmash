"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Star, ChevronLeft, ChevronRight, Users, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

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
    quote: "The parlay builder is exactly what I didn't know I needed. Seeing odds across books? Game-changer.",
    author: "Alex G.",
    role: "Fantasy Sports Enthusiast",
    rating: 5,
  },
  {
    quote: "Clean interface. Easy to use. I'm excited to see where this goes — it's already super useful.",
    author: "Jordan P.",
    role: "trackkotc User & Early Access Tester",
    rating: 5,
  },
]

// Sportsbook data
const sportsbooks = [
  { name: "DraftKings", color: "from-green-500/10 to-green-600/5" },
  { name: "FanDuel", color: "from-blue-500/10 to-blue-600/5" },
  { name: "BetMGM", color: "from-yellow-500/10 to-yellow-600/5" },
  { name: "Caesars", color: "from-purple-500/10 to-purple-600/5" },
  { name: "+ More", color: "from-slate-500/10 to-slate-600/5" },
]

export function SocialProofSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Set visibility for animations when component mounts
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Handle testimonial navigation
  const nextTestimonial = useCallback(() => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial()
    }, 8000)
    return () => clearInterval(interval)
  }, [nextTestimonial])

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.05]" />

      <div className="container relative px-4 mx-auto max-w-7xl">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-slate-900/5 dark:bg-slate-100/5 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
              <Users className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Trusted by 10,000+ bettors</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Join the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                winning community
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              See what serious bettors are saying about our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left side: Stats and Sportsbooks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Featured Stats Card */}
              <Card className="p-6 md:p-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Growing Fast</h3>
                    <p className="text-slate-600 dark:text-slate-400">Active user community</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">10K+</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Active Users</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">50K+</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Bets Compared</div>
                  </div>
                </div>
              </Card>

              {/* Sportsbooks Card */}
              <Card className="p-6 md:p-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Compare odds across major sportsbooks
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sportsbooks.map((book, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br transition-all duration-300 hover:scale-105 hover:shadow-md",
                        book.color,
                      )}
                    >
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                        {book.name}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Featured Review */}
              <Card className="p-6 md:p-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-lg text-slate-700 dark:text-slate-300 mb-4 italic">
                  &quot;OddSmash saves me so much time. No more bouncing between apps — I see all the odds I need in one
                  spot.&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    T
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Tyler M.</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Early Beta Tester</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Right side: Testimonial Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative"
            >
              <Card className="p-6 md:p-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm min-h-[400px] flex flex-col">
                {/* Quote Icon */}
                <div className="text-slate-300 dark:text-slate-600 mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                  </svg>
                </div>

                {/* Testimonial Content */}
                <div className="flex-1 relative mb-8">
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className={cn(
                        "absolute inset-0 transition-all duration-500",
                        index === activeTestimonial
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-0 transform translate-x-4 pointer-events-none",
                      )}
                    >
                      <blockquote className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                        &quot;{testimonial.quote}&quot;
                      </blockquote>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                            {testimonial.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{testimonial.author}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</div>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Controls */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestimonial(index)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          index === activeTestimonial
                            ? "bg-slate-900 dark:bg-slate-100 w-8"
                            : "bg-slate-300 dark:bg-slate-700 w-2 hover:bg-slate-400 dark:hover:bg-slate-600",
                        )}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevTestimonial}
                      className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextTestimonial}
                      className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Disclaimer */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                Testimonials collected from TrackKOTC.com users and OddSmash early testers
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
