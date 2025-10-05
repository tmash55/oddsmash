"use client"


import { FeaturesCTA } from '@/components/features/features-cta'
import { FeaturesHero } from '@/components/features/features-hero'
import { FeatureSection } from '@/components/features/features-section'
import { Zap, TrendingUp, Camera, ShoppingCart } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <FeaturesHero />

      {/* SmashBoard Feature */}
      <div id="smashboard">
        <FeatureSection
          headline="Real-time Odds. Smash-Worthy Insights."
          subheading="Compare player props across sportsbooks with built-in EV analysis and smart filters."
          description="The SmashBoard is your ultimate player prop command center. Instantly compare real-time lines and odds across major books, uncover positive EV bets, and filter by market, team, time, or value. Whether you're hunting for the best strikeout line or building a value-packed parlay, the SmashBoard helps you smash smarter."
          icon={<Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          badge="🔥 Most Popular"
          features={[
            "Real-time odds from 15+ major sportsbooks",
            "Built-in Expected Value (EV) calculations",
            "Advanced filters by market, team, and value",
            "Instant line movement alerts",
            "One-click bet placement",
          ]}
          ctaText="Explore SmashBoard"
        />
      </div>

      {/* Hit Rate Tracker Feature */}
      <div id="hit-rate-tracker">
        <FeatureSection
          headline="How Hot Is That Player? Let the Data Talk."
          subheading="Track how often players hit the over — and explore alternate lines with full context."
          description="Our hit rate engine gives you the truth behind the trend. See how players have performed against their projected lines over the last 5, 10, or 20 games — or create your own custom split. Toggle between alternate lines, visualize player consistency, and make data-backed picks, fast."
          icon={<TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />}
          badge="📊 Data-Driven"
          reverse={true}
          features={[
            "Historical hit rates for any time period",
            "Alternate line performance tracking",
            "Custom split analysis (home/away, vs team, etc.)",
            "Player consistency visualizations",
            "Trend identification and alerts",
          ]}
          ctaText="View Hit Rates"
        />
      </div>

      {/* Betslip Scanner Feature */}
      <div id="betslip-scanner">
        <FeatureSection
          headline="Scan Any Betslip. Find Better Odds. Instantly."
          subheading="Upload or screenshot any betslip — yours, a tweet, or a Discord drop — and we'll do the rest."
          description="Snap a screenshot of your betslip or drop in a link from X (Twitter), Discord, or your favorite capper — and let our AI scanner do the magic. We'll extract every leg, compare each to real-time odds across major books, and even show hit rates and EV for every selection. Know before you bet."
          icon={<Camera className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          badge="🤖 AI-Powered"
          features={[
            "AI-powered betslip extraction from screenshots",
            "Support for Twitter, Discord, and image uploads",
            "Instant odds comparison across all books",
            "Hit rate analysis for each selection",
            "EV calculation for individual legs and parlays",
          ]}
          ctaText="Try Scanner"
        />
      </div>

      {/* Smart Betslip Feature */}
      <div id="smart-betslip">
        <FeatureSection
          headline="Build Your Bets. Boost Your Edge."
          subheading="Add bets from anywhere, then compare legs and full parlays across books."
          description="Add player props from any page to your smart betslip. When you're ready, review the full bet or parlay and see which sportsbook gives you the best total payout. You'll even get insights like individual leg value, historical hit rates, and deep links to place your bet. It's like a shopping cart — but for smashing lines."
          icon={<ShoppingCart className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
          badge="🛒 Smart Builder"
          reverse={true}
          features={[
            "Add bets from any page with one click",
            "Real-time parlay payout comparison",
            "Individual leg value analysis",
            "Historical performance for each selection",
            "Direct links to place bets at best odds",
          ]}
          ctaText="Build Betslip"
        />
      </div>

      {/* CTA Section */}
      <FeaturesCTA />
    </div>
  )
}
