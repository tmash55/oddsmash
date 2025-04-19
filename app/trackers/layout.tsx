import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "NBA Trackers | Oddsmash",
  description: "Track NBA stats, leaderboards, and contests in real-time",
};

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <Suspense
          fallback={
            <div className="h-[200px] flex items-center justify-center">
              Loading...
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
