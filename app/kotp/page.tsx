"use client";

import Link from "next/link";
import { Medal, Trophy, ChevronRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function KOTPLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              King of the Playoffs
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Track the NBA playoff scoring leaders for the $2 million
              DraftKings contest.
            </p>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-6 mb-8 md:grid-cols-3"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">The Contest</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2 Million</div>
              <p className="text-xs text-muted-foreground">
                Total prize pool in DraftKings bonus bets
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objective</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pick the Top Scorer</div>
              <p className="text-xs text-muted-foreground">
                Correctly predict which player will score the most total points
                in Round 1
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Live Tracking
              </CardTitle>
              <Medal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Updated Every 30 Seconds</div>
              <p className="text-xs text-muted-foreground">
                Our leaderboard combines live data with completed game totals
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-medium">
                    1
                  </span>
                  <div>
                    <strong>Contest Period:</strong> Covers all Round 1 playoff
                    games (approximately April 20 - May 5, 2024)
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-medium">
                    2
                  </span>
                  <div>
                    <strong>The Objective:</strong> Pick the player who will
                    score the most total points throughout all Round 1 games
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-medium">
                    3
                  </span>
                  <div>
                    <strong>Prizes:</strong> Correctly picking the top scorer
                    means you split the $2 million prize pool with other winners
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-medium">
                    4
                  </span>
                  <div>
                    <strong>Participation:</strong> To participate, users must
                    enter through the DraftKings app by making a qualifying bet
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our <strong>KOTP Leaderboard</strong> is updated automatically
                throughout each playoff game to track scoring leaders. The
                leaderboard combines:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>
                    <strong>Completed games:</strong> Official point totals from
                    all finished Round 1 games
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>
                    <strong>Live games:</strong> Points being scored in games
                    currently in progress
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>
                    <strong>Stats:</strong> Total points, PPG, and games played
                    for each player
                  </span>
                </li>
              </ul>
              <div className="flex justify-center pt-4">
                <Link href="/trackers/kotp-leaderboard">
                  <Button size="lg" className="gap-2">
                    View Live Leaderboard
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center text-sm text-muted-foreground py-6 mt-8">
          <p>
            OddSmash is not affiliated with DraftKings. This is an independent
            tracking tool. For official contest rules, please visit the
            DraftKings app or website.
          </p>
        </div>
      </div>
    </div>
  );
}
