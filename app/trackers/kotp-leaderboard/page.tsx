"use client";

import { motion } from "framer-motion";
import { ExternalLink, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import KOTPWinner from "@/components/trackers/kotp/kotp-winner";

export default function KOTPWinnerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          <div className="flex justify-end">
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                King of the Playoffs
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                DraftKings $2M contest results - Round 1 completed
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 w-full sm:w-auto max-w-[200px]"
                asChild
              >
                <a href="https://twitter.com/trackkotc" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                  Follow for Updates
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 w-full sm:w-auto max-w-[200px]"
                asChild
              >
                <a href="https://www.draftkings.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  DraftKings
                </a>
              </Button>
            </div>
          </motion.div>

          <KOTPWinner />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-center text-muted-foreground text-sm"
          >
            <p>
              Thank you for following the King of the Playoffs contest.
              Stay tuned for more exciting promotions and hit rate analysis!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}