"use client";

import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BetslipButtonProps {
  legsCount: number;
  onClick: () => void;
}

export function BetslipButton({ legsCount, onClick }: BetslipButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 sm:bottom-6 sm:right-6 sm:left-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          size="lg"
          onClick={onClick}
          className={cn(
            "w-full sm:w-auto rounded-full shadow-lg h-auto text-base relative overflow-hidden",
            "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
            "transition-all duration-300 ease-in-out",
            "px-4 py-3 sm:px-6 sm:py-4"
          )}
        >
          <span className="absolute inset-0 bg-white/10 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
          <div className="flex items-center justify-center">
            <div className="relative mr-2">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              {legsCount > 0 && (
                <motion.span
                  key={legsCount}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold rounded-full h-3 w-3 flex items-center justify-center"
                >
                  {legsCount}
                </motion.span>
              )}
            </div>
            <span className="font-medium">Betslip</span>
          </div>
        </Button>
      </motion.div>
    </div>
  );
}
