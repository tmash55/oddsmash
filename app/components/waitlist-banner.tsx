'use client';

import { StickyBanner } from "@/components/ui/sticky-banner";
import Link from "next/link";

export function WaitlistBanner() {
  return (
    <StickyBanner 
      className="bg-gradient-to-r from-blue-500/90 to-purple-600/90 shadow-lg"
      hideOnScroll={false}
    >
      <div className="flex items-center justify-center gap-2 text-white/95 text-sm sm:text-base py-1">
        <span className="hidden sm:inline">🚀</span>
        <p className="mx-0 max-w-[90%] drop-shadow-md">
          Get early access to our new Hit Rate and Hit Sheets features.{" "}
          <Link 
            href="/join-us" 
            className="font-medium underline-offset-2 hover:underline transition duration-200"
          >
            Join the waitlist →
          </Link>
        </p>
      </div>
    </StickyBanner>
  );
} 