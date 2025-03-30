import Link from "next/link";
import { Button } from "@/components/ui/button";

import { ArrowRight, BarChart3, Calendar, PieChart } from "lucide-react";
import { GradientBackground } from "../ui/gradient-background";
import { SectionTransition } from "../ui/section-transition";

export function HeroSection() {
  return (
    <div className="relative">
      <GradientBackground />
      <div className="container relative flex flex-col items-center justify-center space-y-10 py-16 text-center md:py-24 lg:py-32">
        <div className="space-y-4">
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Smarter Betting Starts Here
          </div>
          <div className="inline-block rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary mx-2">
            100% Free
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Find the Best Odds.{" "}
            <span className="text-primary">Every Time.</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Compare odds across major sportsbooks, track promos, and build
            optimal parlays with our cutting-edge betting tools.{" "}
            <span className="font-medium text-primary">100% free.</span>
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="#">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Explore Tools</Link>
          </Button>
        </div>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 pt-8 md:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="rounded-full bg-primary/10 p-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Prop Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Compare player props across all major sportsbooks
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="rounded-full bg-primary/10 p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Promo Calendar</h3>
            <p className="text-sm text-muted-foreground">
              Never miss a valuable sportsbook promotion
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="rounded-full bg-primary/10 p-3">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Parlay Builder</h3>
            <p className="text-sm text-muted-foreground">
              Build parlays and compare payouts across books
            </p>
          </div>
        </div>
      </div>
      <SectionTransition position="bottom" />
    </div>
  );
}
