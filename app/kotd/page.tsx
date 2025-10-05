"use client";

import Link from "next/link";
import { Crown, ArrowRight, BookOpen, Trophy, Zap, Sparkles, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function KOTDRulesPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-8 space-y-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl md:text-4xl font-bold">King of the Diamond</h1>
        </div>
        <p className="text-xl text-muted-foreground">How It Works</p>
        
        <Link href="/trackers/kotd-leaderboard" className="mt-4 inline-block">
          <Button className="mt-4">
            Go to Live Tracker <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>The Rules</CardTitle>
          </div>
          <CardDescription>
            King of the Diamond is a daily promo on DraftKings where one home run swing could earn you a share of $1,000,000 — and you don&apos;t even need your parlay to hit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>DraftKings gives you an odds boost token to use on a 2–5 leg parlay featuring players to hit a home run.</p>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">If any one of your selected players:</p>
            <ul className="space-y-2 ml-6 list-disc">
              <li>Hits a home run</li>
              <li>AND is on the team that scores the most total runs across all MLB games that day...</li>
            </ul>
            <div className="mt-4 flex items-center">
              <Badge className="bg-green-600 text-white">
                <Trophy className="h-3 w-3 mr-1" /> You win a split of the $1,000,000 prize pool
              </Badge>
              <span className="ml-2 text-sm text-muted-foreground">— even if your full parlay doesn&apos;t cash.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Example</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You build this 5-leg HR parlay using the boost:</p>
          
          <ul className="space-y-2 ml-6 list-disc">
            <li>Aaron Judge (Yankees)</li>
            <li>Bryce Harper (Phillies)</li>
            <li>Elly De La Cruz (Reds)</li>
            <li>Rafael Devers (Red Sox)</li>
            <li>Freddie Freeman (Dodgers)</li>
          </ul>
          
          <div className="bg-muted p-4 rounded-lg mt-4">
            <p>If Bryce Harper hits a home run, and the Phillies score the most runs of any MLB team that day, you win a share of the million — no matter what happens with the rest of your picks.</p>
          </div>
          
          <div className="flex items-center mt-4">
            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="font-medium">You just need ONE home run from a player on the top-scoring team.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Two Main Ways to Play</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Badge className="mr-2">1</Badge> Max Out the Boost
              </h3>
              <ul className="space-y-2 ml-6 list-disc">
                <li>Use the odds boost (boost varies per user)</li>
                <li>Bet the maximum allowed (max bet varies per user)</li>
                <li>Target power hitters on high-scoring teams</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Badge className="mr-2">2</Badge> Play the Long Game
              </h3>
              <ul className="space-y-2 ml-6 list-disc">
                <li>Place a minimum bet (as low as $0.10)</li>
                <li>Build stacks daily</li>
                <li>One homer on the right team can still land you a payout</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Pro Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 ml-6 list-disc">
            <li>Stack players from the same team for better odds</li>
            <li>
                Use weather, park factors, and matchup data — 
                <Link href="https://www.ballparkpal.com/" target="_blank" rel="noopener noreferrer" className="underline text-primary font-medium">
                    BallparkPal
                </Link> is a great resource.
            </li>

            <li>
              Use our Live Home Run Tracker:
              <ul className="space-y-2 mt-2 ml-6 list-disc">
                <li>⭐ Star your picks</li>
                <li>🔥 See who&apos;s gone deep</li>
                <li>🏆 Track team scoring to identify the frontrunner</li>
              </ul>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Link href="/trackers/kotd-leaderboard" className="w-full">
            <Button className="w-full">
              Go to Live Tracker <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Alert className="bg-muted border">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium">Disclaimer</p>
          <p className="text-sm mt-1">This tracker is not affiliated with or endorsed by DraftKings. We built it as a free tool to help users follow the King of the Diamond promo and have fun tracking their picks.</p>
          <p className="text-sm mt-2">Always check DraftKings for the official rules, eligibility, and daily prize details.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
} 