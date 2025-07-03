import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SportLogo } from "@/components/sport-logo";

// Define sports configuration
const sportsConfig = {
  mlb: {
    name: "MLB",
    description: "Major League Baseball stats and analytics",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "hit-sheets",
        name: "Hit Sheets",
        description: "Player prop sheets and analysis",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
  nba: {
    name: "NBA",
    description: "National Basketball Association stats and analytics",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
  nfl: {
    name: "NFL",
    description: "National Football League stats and analytics",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
  nhl: {
    name: "NHL",
    description: "National Hockey League stats and analytics",
    features: [
      {
        id: "hit-rates",
        name: "Hit Rates",
        description: "Track player prop hit rates and trends",
      },
      {
        id: "box-scores",
        name: "Box Scores",
        description: "Live game stats and box scores",
      },
      {
        id: "parlay",
        name: "Parlay Builder",
        description: "Build and track your parlays",
      },
    ],
  },
};

interface SportPageProps {
  params: {
    sport: keyof typeof sportsConfig;
  };
}

export async function generateMetadata({ params }: SportPageProps): Promise<Metadata> {
  const sport = sportsConfig[params.sport];
  if (!sport) return { title: "Not Found" };

  return {
    title: `${sport.name} Dashboard | OddSmash`,
    description: sport.description,
  };
}

export default function SportPage({ params }: SportPageProps) {
  const sport = sportsConfig[params.sport];
  if (!sport) notFound();

  return (
    <div className="space-y-6">
      {/* Sport Header */}
      <div className="flex items-center gap-4">
        <SportLogo sport={params.sport} size="lg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sport.name} Dashboard</h1>
          <p className="text-muted-foreground">{sport.description}</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sport.features.map((feature) => (
          <Card key={feature.id} className="hover:bg-muted/50 transition-colors">
            <Link href={`/dashboard/${params.sport}/${feature.id}`}>
              <CardHeader>
                <CardTitle>{feature.name}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Feature-specific preview content could go here */}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
} 