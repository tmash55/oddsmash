"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { SPORT_CONFIGS, SUPPORTED_SPORTS } from "@/types/sports"
import Link from "next/link"
import { ArrowRight, TrendingUp, History, Filter, BarChart3 } from "lucide-react"

const FEATURE_HIGHLIGHTS = [
  {
    title: "Historical Performance",
    description: "Track player performance over the last 5, 10, and 20 games to identify consistent trends.",
    icon: History,
  },
  {
    title: "Advanced Filters",
    description: "Filter by hit rates, markets, and more to find the most promising opportunities.",
    icon: Filter,
  },
  {
    title: "Real-time Odds",
    description: "Compare current odds across major sportsbooks to find the best value.",
    icon: TrendingUp,
  },
  {
    title: "Visual Analytics",
    description: "View performance distributions and streaks through intuitive visualizations.",
    icon: BarChart3,
  },
]

export default function HitRatesLandingPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Player Hit Rates</h1>
        <p className="text-xl text-muted-foreground max-w-[85ch] mx-auto">
          Analyze player performance patterns and find value opportunities across multiple sports using our comprehensive hit rate analysis tools.
        </p>
      </div>

      {/* Sport Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {SUPPORTED_SPORTS.map((sport) => {
          const config = SPORT_CONFIGS[sport]
          const defaultMarket = encodeURIComponent(config.defaultMarket)
          return (
            <Link key={sport} href={`/hit-rates/${sport}/${defaultMarket}`} className="block">
              <Card className={`
                h-full transition-all duration-200 hover:shadow-lg
                ${config.isActive ? 'hover:border-primary' : 'opacity-80'}
              `}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {config.name}
                    {config.isActive && <ArrowRight className="h-5 w-5" />}
                  </CardTitle>
                  <CardDescription>
                    {config.isActive ? (
                      `Track ${config.statTerminology.hitRate.toLowerCase()} across ${config.markets.length} markets`
                    ) : (
                      config.comingSoonMessage
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Feature Highlights */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">
          Make Better Decisions with Hit Rate Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURE_HIGHLIGHTS.map((feature) => (
            <Card key={feature.title} className="border bg-card">
              <CardHeader>
                <div className="mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How to Use Section */}
      <section className="max-w-[85ch] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>How to Use Hit Rates</CardTitle>
            <CardDescription>
              Follow these steps to get the most out of our hit rate analysis tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Select Your Sport</h3>
              <p className="text-muted-foreground">
                Choose from our supported sports above. Each sport has specialized markets and analysis tools.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Choose Your Market</h3>
              <p className="text-muted-foreground">
                Filter by specific statistical categories like hits, points, or yards depending on the sport.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Apply Filters</h3>
              <p className="text-muted-foreground">
                Narrow down players by hit rates, recent performance, and other criteria to find the best opportunities.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">4. Compare Odds</h3>
              <p className="text-muted-foreground">
                Review current odds from multiple sportsbooks alongside historical performance data to identify value.
              </p>
      </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
