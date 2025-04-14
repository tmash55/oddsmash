import { redirect } from "next/navigation";
import { getMarketsForSport, getDefaultMarket } from "@/lib/constants/markets";

// Map route param to API sport key
const sportMap: { [key: string]: string } = {
  nba: "basketball_nba",
  ncaab: "basketball_ncaab",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  nfl: "americanfootball_nfl",
};

export default function PlayerPropsPage({
  params,
}: {
  params: { sport: string };
}) {
  const { sport } = params;

  // Map route param to API sport key
  const apiSport = sportMap[sport];

  // If sport is invalid, return 404
  if (!apiSport) {
    redirect("/nba/props");
  }

  // Get default prop type for this sport
  const defaultMarket = getMarketsForSport(apiSport).find(
    (m) => m.value === getDefaultMarket(apiSport)
  );
  const defaultPropType =
    defaultMarket?.label.toLowerCase().replace(/\s+/g, "-") || "points";

  // Redirect to the default prop type
  redirect(`/${sport}/props/${defaultPropType}`);
}
