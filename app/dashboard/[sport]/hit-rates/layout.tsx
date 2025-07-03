import { ReactNode } from "react";
import { Metadata } from "next";

interface HitRatesLayoutProps {
  children: ReactNode;
  params: {
    sport: string;
  };
}

export const metadata: Metadata = {
  title: "Hit Rates | OddSmash",
  description: "Track player prop hit rates and trends",
};

export default function HitRatesLayout({ children, params }: HitRatesLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hit Rates</h1>
        <p className="text-muted-foreground">
          Track and analyze player prop hit rates for {params.sport.toUpperCase()}
        </p>
      </div>
      {children}
    </div>
  );
} 