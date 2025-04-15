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

// Helper function to convert URL-friendly propType to market label format
function urlPropTypeToMarketLabel(propType: string): string {
  console.log("urlPropTypeToMarketLabel input:", propType);

  // Handle special cases first
  if (propType === "pra") {
    return "Pts+Reb+Ast";
  }

  // Replace "-plus-" with "+" and hyphens with spaces
  const result = propType.replace(/-plus-/g, "+").replace(/-/g, " ");
  console.log("urlPropTypeToMarketLabel output:", result);
  return result;
}

// Helper function to convert market label to URL-friendly format
function marketLabelToUrlPropType(label: string): string {
  console.log("marketLabelToUrlPropType input:", label);

  // Handle special cases first
  if (
    label === "PTS+REB+AST" ||
    label === "Points+Rebounds+Assists" ||
    label === "Pts+Reb+Ast"
  ) {
    return "pra";
  }

  // Replace plus signs with "-plus-" and spaces with hyphens
  const result = label
    .toLowerCase()
    .replace(/\+/g, "-plus-")
    .replace(/\s+/g, "-");
  console.log("marketLabelToUrlPropType output:", result);
  return result;
}

// Update the isValidPropType function to handle the new URL format
function isValidPropType(sport: string, propType: string): boolean {
  console.log("isValidPropType checking:", propType, "for sport:", sport);
  const markets = getMarketsForSport(sport);

  // Special case for PRA
  if (propType === "pra") {
    console.log("Special case for PRA");
    return markets.some(
      (market) =>
        market.label === "PTS+REB+AST" ||
        market.label === "Points+Rebounds+Assists" ||
        market.label === "Pts+Reb+Ast"
    );
  }

  // Convert URL propType to a format that can be compared with market labels
  const normalizedPropType = urlPropTypeToMarketLabel(propType);
  console.log("Normalized propType:", normalizedPropType);

  // Check if any market matches this normalized prop type
  const isValid = markets.some((market) => {
    const marketUrl = marketLabelToUrlPropType(market.label);
    const matchesLabel =
      market.label.toLowerCase() === normalizedPropType.toLowerCase();
    const matchesUrl = marketUrl === propType;

    console.log(`Checking market: ${market.label} (URL: ${marketUrl})`);
    console.log(`- Matches label: ${matchesLabel}, Matches URL: ${matchesUrl}`);

    return matchesLabel || matchesUrl;
  });

  console.log("isValidPropType result:", isValid);
  return isValid;
}

export async function generateMetadata({
  params,
}: PlayerPropsPageProps): Promise<Metadata> {
  const { sport, propType } = params;
  const apiSport = sportMap[sport] || "basketball_nba";
  const sportDisplayName = getSportDisplayName(apiSport);

  // Convert URL-friendly propType to display name
  let propTypeDisplay = urlPropTypeToMarketLabel(propType);

  // Handle special cases
  if (propType === "pra") {
    propTypeDisplay = "PRA (Points+Rebounds+Assists)";
  } else {
    const markets = getMarketsForSport(apiSport);
    const market = markets.find(
      (m) => marketLabelToUrlPropType(m.label) === propType
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
  console.log("Page rendering with propType:", propType);

  // Map route param to API sport key
  const apiSport = sportMap[sport];

  // If sport is invalid, return 404
  if (!apiSport) {
    console.log("Invalid sport, returning 404");
    notFound();
  }

  // If propType is invalid, redirect to default
  if (!isValidPropType(apiSport, propType)) {
    console.log("Invalid propType, redirecting to default");

    // Get default prop type for this sport
    const defaultMarket = getMarketsForSport(apiSport).find(
      (m) => m.value === getDefaultMarket(apiSport)
    );
    const defaultPropType = defaultMarket
      ? marketLabelToUrlPropType(defaultMarket.label)
      : "points";

    console.log("Redirecting to:", `/${sport}/props/${defaultPropType}`);

    // Redirect to the default prop type
    redirect(`/${sport}/props/${defaultPropType}`);
  }

  return <PlayerPropsClientPage params={{ sport }} propType={propType} />;
}
