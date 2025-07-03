import { ReactNode } from "react";
import { notFound } from "next/navigation";

// Define valid sports
const validSports = ["mlb", "nba", "nfl", "nhl"];

interface SportLayoutProps {
  children: ReactNode;
  params: {
    sport: string;
  };
}

export default function SportLayout({ children, params }: SportLayoutProps) {
  // Validate sport parameter
  if (!validSports.includes(params.sport)) {
    notFound();
  }

  return (
    <div className="flex flex-col space-y-8">
      {/* Sport-specific content wrapper */}
      <div className="flex-1 space-y-4">
        {children}
      </div>
    </div>
  );
}

// Generate static params for valid sports
export function generateStaticParams() {
  return validSports.map((sport) => ({
    sport,
  }));
}
