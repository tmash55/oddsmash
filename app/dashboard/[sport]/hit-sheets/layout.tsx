import { ReactNode } from "react";
import { Metadata } from "next";

interface HitSheetsLayoutProps {
  children: ReactNode;
  params: {
    sport: string;
  };
}

export const metadata: Metadata = {
  title: "Hit Sheets | OddSmash",
  description: "Player prop sheets and analysis",
};

export default function HitSheetsLayout({ children, params }: HitSheetsLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hit Sheets</h1>
        <p className="text-muted-foreground">
          Detailed player prop sheets and analysis for {params.sport.toUpperCase()}
        </p>
      </div>
      {children}
    </div>
  );
} 