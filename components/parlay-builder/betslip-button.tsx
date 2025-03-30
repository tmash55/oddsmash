"use client";

import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

interface BetslipButtonProps {
  legsCount: number;
  onClick: () => void;
}

export function BetslipButton({ legsCount, onClick }: BetslipButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:right-6 sm:left-auto">
      <Button
        size="lg"
        onClick={onClick}
        className="w-full sm:w-auto rounded-full shadow-lg px-6 py-6 h-auto text-base"
      >
        <Receipt className="h-5 w-5 mr-2" />
        <span>Betslip ({legsCount})</span>
      </Button>
    </div>
  );
}
