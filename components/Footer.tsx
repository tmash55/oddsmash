"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Mail, Twitter, Instagram, Facebook, TrendingUp, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const currentYear = new Date().getFullYear()

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail("")
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-t border-slate-200/50 dark:border-slate-700/50">
      <div className="container px-4 py-16 mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Newsletter - 5 columns on desktop */}
          <div className="lg:col-span-5 space-y-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white dark:text-slate-900" />
                </div>
                <span className="font-bold text-2xl text-slate-900 dark:text-slate-100">OddSmash</span>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                Compare odds across sportsbooks to maximize your potential returns. Never leave money on the table again
                with our free betting tools.
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Stay Updated</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get the latest odds insights and betting tips delivered to your inbox
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    required
                  />
                  <Button
                    type="submit"
                    className={cn(
                      "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 transition-all duration-200",
                      isSubscribed && "bg-green-600 hover:bg-green-600",
                    )}
                    disabled={isSubscribed}
                  >
                    {isSubscribed ? (
                      "Subscribed!"
                    ) : (
                      <>
                        Subscribe
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We'll never share your email. Unsubscribe anytime.
                </p>
              </form>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400">100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Real-time Odds</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400">10,000+ Users</span>
              </div>
            </div>
          </div>

          {/* Navigation Links - 7 columns on desktop */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Sports & Tools */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sports & Tools</h3>
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/mlb/props"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  MLB Props
                </Link>
                <Link
                  href="/nba/props"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  NBA Props
                </Link>
                <Link
                  href="/nfl/props"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  NFL Props
                </Link>
                <Link
                  href="/nhl/props"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  NHL Props
                </Link>
                <Link
                  href="/parlay-builder"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Parlay Builder
                </Link>
                <Link
                  href="/promo-calendar"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Promo Calendar
                </Link>
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Company</h3>
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/about"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/blog"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Blog
                </Link>
                <Link
                  href="/help"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  href="/careers"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Careers
                </Link>
              </nav>
            </div>

            {/* Legal & Support */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Legal & Support</h3>
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/terms-of-service"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/responsible-gambling"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Responsible Gambling
                </Link>
                <Link
                  href="/api-docs"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  API Documentation
                </Link>
                <Link
                  href="/status"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  System Status
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center mt-16 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
          {/* Social Links */}
          <div className="flex space-x-6 mb-6 lg:mb-0">
            <a
              href="https://twitter.com/oddsmash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Twitter"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/oddsmash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com/oddsmash"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Facebook"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="mailto:support@oddsmash.com"
              aria-label="Email us"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* Copyright & Legal */}
          <div className="text-center lg:text-right space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">© {currentYear} OddSmash. All rights reserved.</p>
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>21+ | Please gamble responsibly</span>
              <span className="hidden sm:inline">•</span>
              <Link
                href="/responsible-gambling"
                className="underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Get Help
              </Link>
              <span className="hidden sm:inline">•</span>
              <span>Licensed & Regulated</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
