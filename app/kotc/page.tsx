"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, BarChart3, Clock, ExternalLink } from "lucide-react";

export default function KOTCInfoPage() {
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
              Track DraftKings King of the Court
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              View live PRA stats, see today&apos;s NBA matchups, and follow the
              leaderboard for DraftKings&apos; KOTC promo — all free and updated in
              real time.
            </p>
            <div className="pt-2">
              <Link href="/trackers/pra-leaderboard?kotc=true">
                <Button size="lg" className="gap-2">
                  View KOTC Leaderboard
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
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
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">King of the Court</div>
              <p className="text-xs text-muted-foreground">
                DraftKings&apos; daily contest for NBA fans to predict top performers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracking</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PRA Stats</div>
              <p className="text-xs text-muted-foreground">
                Points + Rebounds + Assists combined for each player
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Real-Time Data</div>
              <p className="text-xs text-muted-foreground">
                Our leaderboard updates automatically every 30 seconds during
                games
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What is KOTC?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                King of the Court (KOTC) is a DraftKings promo where users
                compete to pick players who rack up the most Points + Rebounds +
                Assists in real NBA games. Prizes are awarded based on how your
                selections stack up against others.
              </p>
              <p>
                Players can be selected each day of the promo, and their total
                PRA stats count toward your score. The contest runs throughout
                the NBA season with special promotions during key games.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why use Oddsmash?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 md:grid-cols-2">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>Live leaderboard with real-time PRA updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>DraftKings odds and promo picks</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>Today&apos;s NBA schedule all in one place</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>Clean interface with light & dark mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>No login required – completely free</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>Mobile-friendly design for on-the-go tracking</span>
                </li>
              </ul>
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
