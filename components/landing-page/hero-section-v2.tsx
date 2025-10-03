"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

export function HeroSectionV2() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[26rem] h-[26rem] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="grid gap-10 md:gap-14 lg:grid-cols-2 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <Badge className="mb-5" variant="secondary">
              Built for +EV bettors
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Smarter Bets. Better Odds. <span className="text-emerald-500">More Profit.</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Compare prop lines, find +EV bets, and crush the books—faster than anyone else.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" className="h-12 px-6" asChild>
                <Link href="/positive-ev">See Today’s Best Bets</Link>
              </Button>
              <Button size="lg" className="h-12 px-6 bg-transparent" variant="outline" asChild>
                <Link href="/sign-up">Start Free</Link>
              </Button>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">Trusted by 1,500+ bettors</div>
          </div>

          {/* Micro tool / live value example */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 text-center">
              <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">EV Tool Demo</div>
                  <div className="text-xs text-muted-foreground/70">GIF placeholder - Live tool demonstration</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
