"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { HelpCircle, Plus, Minus } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

const faqData = [
  {
    question: "Is OddSmash really free?",
    answer:
      "Yes — 100% free to use. Just head to the tools and start comparing odds right away. No hidden fees, no subscriptions, no catch.",
    category: "General",
  },
  {
    question: "What sportsbooks are included?",
    answer:
      "OddSmash compares player props and parlays from all major U.S. sportsbooks like DraftKings, FanDuel, Caesars, BetMGM, ESPN Bet, and more. Coverage may vary based on your location.",
    category: "Features",
  },
  {
    question: "How does the Parlay Builder work?",
    answer:
      "Add legs to your parlay and we'll instantly show you which sportsbook is offering the highest payout. Then click to add it directly to your betslip.",
    category: "Features",
  },
  {
    question: "Do you update odds in real-time?",
    answer:
      "We update odds frequently throughout the day — and the closer we get to game time, the more often we check for changes. This ensures you're seeing the most accurate and current lines when it matters most.",
    category: "Technical",
  },
  {
    question: "What is the Promo Calendar?",
    answer:
      "Our upcoming Promo Calendar will highlight the best sportsbook recurring promotions available each day — so you never miss a bonus or boost again.",
    category: "Features",
  },
  {
    question: "Can I bet directly on OddSmash?",
    answer:
      "No, OddSmash doesn't take bets — we show you where the best lines are, then link you directly to the sportsbook to place your bet. Always double check your bet with the sportsbook before placing a bet.",
    category: "General",
  },
  {
    question: "How accurate are your EV calculations?",
    answer:
      "Our EV calculations use market-average pricing and no-vig methods to identify value. While no system is perfect, our algorithms help surface potentially profitable betting opportunities.",
    category: "Technical",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No account required! You can use all our comparison tools immediately. We may add optional accounts in the future for saving preferences and betslips.",
    category: "General",
  },
]

export function FaqSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] md:bg-[length:30px_30px] opacity-5 dark:opacity-10"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-slate-200/20 dark:bg-slate-700/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-300/20 dark:bg-slate-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <HelpCircle className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
              Everything You Need to Know
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Get answers to common questions about OddSmash and our betting tools.
            </p>
          </motion.div>

          {/* FAQ Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-300/50 dark:hover:border-slate-600/50 transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {faq.question}
                      </h3>
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {faq.category}
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {openItems.has(index) ? (
                        <Minus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <Plus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: openItems.has(index) ? "auto" : 0,
                    opacity: openItems.has(index) ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-12 md:mt-16"
          >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Still have questions?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We&apos;re here to help! Reach out to our team for personalized support.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:support@oddsmash.com"
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-200"
                >
                  Contact Support
                </a>
                <a
                  href="/mlb/odds"
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  Try OddSmash Now
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
