import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PropComparisonDashboardV2 } from '@/components/prop-comparison/v2/prop-comparison-dashboard-v2';
import { SUPPORTED_SPORTS, SUPPORTED_MARKETS } from '@/lib/constants/markets';

type SupportedSport = typeof SUPPORTED_SPORTS[number];

// Convert market slug to display name
const getMarketDisplayName = (market: string) => {
  return market.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Get sport display name
const getSportDisplayName = (sport: string) => {
  const sportMap: Record<string, string> = {
    mlb: 'MLB',
    nba: 'NBA',
    nfl: 'NFL',
    nhl: 'NHL'
  };
  return sportMap[sport] || sport.toUpperCase();
};

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { sport: string; market: string } }): Promise<Metadata> {
  const sport = params.sport.toLowerCase();
  const market = params.market.toLowerCase();
  
  const sportDisplay = getSportDisplayName(sport);
  const marketDisplay = getMarketDisplayName(market);
  
  return {
    title: `${sportDisplay} ${marketDisplay} Props & Odds Comparison | OddsMash`,
    description: `Compare ${sportDisplay} ${marketDisplay} prop betting odds across top sportsbooks. Find the best lines and odds for ${sportDisplay} player ${marketDisplay} props.`,
    keywords: `${sportDisplay} props, ${marketDisplay} props, sports betting odds, prop betting, ${sport} player props, betting lines, odds comparison`,
    openGraph: {
      title: `${sportDisplay} ${marketDisplay} Props & Odds Comparison`,
      description: `Find the best ${sportDisplay} ${marketDisplay} prop betting odds across multiple sportsbooks. Live odds updates and easy comparison.`,
      type: 'website',
    },
  };
}

export default function PropComparisonMarketPage({ params }: { params: { sport: string; market: string } }) {
  const sport = params.sport.toLowerCase() as SupportedSport;
  const market = params.market.toLowerCase();

  // Validate sport and market
  if (!SUPPORTED_SPORTS.includes(sport) || !SUPPORTED_MARKETS[sport]?.includes(market)) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {getSportDisplayName(sport)} {getMarketDisplayName(market)} Props
      </h1>
      <PropComparisonDashboardV2 sport={sport} />
    </div>
  );
} 