import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PlayerPropsClientPage from "../PlayerPropsClientPage";
import { getMarketsForSport, getDefaultMarket } from "@/lib/constants/markets";

interface PlayerPropsPageProps {
  params: {
    sport: string;
    propType: string;
  };
}

// Map route param to API sport key
const sportMap: { [key: string]: string } = {
  nba: "basketball_nba",
  ncaab: "basketball_ncaab",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  nfl: "americanfootball_nfl",
};

// Get display name for the sport
const getSportDisplayName = (sportKey: string) => {
  const displayNames: { [key: string]: string } = {
    basketball_nba: "NBA",
    basketball_ncaab: "NCAAB",
    baseball_mlb: "MLB",
    icehockey_nhl: "NHL",
    americanfootball_nfl: "NFL",
  };
  return displayNames[sportKey] || "NBA";
};

// Update the isValidPropType function to handle special cases like "pra"
function isValidPropType(sport: string, propType: string): boolean {
  const markets = getMarketsForSport(sport);

  // Check for direct match
  const directMatch = markets.some(
    (market) => market.label.toLowerCase().replace(/\s+/g, "-") === propType
  );

  if (directMatch) return true;

  // Check for special cases
  if (propType === "pra") {
    return markets.some(
      (market) =>
        market.label === "PTS+REB+AST" ||
        market.label === "Points+Rebounds+Assists"
    );
  }

  return false;
}

// Also update the generateMetadata function to handle special cases
export async function generateMetadata({
  params,
}: PlayerPropsPageProps): Promise<Metadata> {
  const { sport, propType } = params;
  const apiSport = sportMap[sport] || "basketball_nba";
  const sportDisplayName = getSportDisplayName(apiSport);

  // Convert URL-friendly propType to display name
  let propTypeDisplay = propType.replace(/-/g, " ");

  // Handle special cases
  if (propType === "pra") {
    propTypeDisplay = "PRA (Points+Rebounds+Assists)";
  } else {
    const markets = getMarketsForSport(apiSport);
    const market = markets.find(
      (m) => m.label.toLowerCase().replace(/\s+/g, "-") === propType
    );
    if (market) {
      propTypeDisplay = market.label;
    }
  }

  return {
    title: `${sportDisplayName} ${propTypeDisplay} Props | Compare Odds`,
    description: `Compare ${sportDisplayName} ${propTypeDisplay} player prop odds across DraftKings, FanDuel, BetMGM and more. Find the best lines and odds for ${sportDisplayName} ${propTypeDisplay} props.`,
    keywords: `${sportDisplayName} props, ${propTypeDisplay} props, player props, sports betting, odds comparison, ${sportDisplayName} betting`,
  };
}

export default function PlayerPropsPage({ params }: PlayerPropsPageProps) {
  const { sport, propType } = params;

  // Map route param to API sport key
  const apiSport = sportMap[sport];

  // If sport is invalid, return 404
  if (!apiSport) {
    notFound();
  }

  // If propType is invalid, redirect to default
  if (!isValidPropType(apiSport, propType)) {
    // Get default prop type for this sport
    const defaultMarket = getMarketsForSport(apiSport).find(
      (m) => m.value === getDefaultMarket(apiSport)
    );
    const defaultPropType =
      defaultMarket?.label.toLowerCase().replace(/\s+/g, "-") || "points";

    // Redirect to the default prop type
    redirect(`/${sport}/props/${defaultPropType}`);
  }

  return <PlayerPropsClientPage params={{ sport }} propType={propType} />;
}
