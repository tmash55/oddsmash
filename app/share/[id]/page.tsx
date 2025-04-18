import type { Metadata } from "next";
import Image from "next/image";
import { getSharedProp, isSharedPropStale } from "@/lib/share-utils";
import { AlertCircle, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sportsbooks } from "@/data/sportsbooks";
import { cn } from "@/lib/utils";
import { RefreshButton, ComparePropsButton, ShareModalButton } from "./client";
import { BookmakerCard } from "./bookmaker-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define types for bookmaker data
interface Outcome {
  name: string;
  price: number;
  point: number;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface BookmakerData {
  key: string;
  title?: string;
  markets?: Market[];
  outcomes?: {
    over?: { price: number; sid?: string; link?: string };
    under?: { price: number; sid?: string; link?: string };
  };
  // Add fields for deep linking
  sid?: string;
  link?: string;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const sharedProp = await getSharedProp(id);

  if (!sharedProp) {
    return {
      title: "Shared Prop Not Found | Oddsmash",
      description: "The shared prop you're looking for does not exist.",
    };
  }

  const betTypeText =
    sharedProp.betType === "over"
      ? "Over"
      : sharedProp.betType === "under"
      ? "Under"
      : "";

  // Generate absolute URL for the OG image
  // Use VERCEL_URL in production, but fall back to localhost in development
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const ogImageUrl = `${baseUrl}/api/og/share/${id}`;

  return {
    title: `${sharedProp.player} ${sharedProp.statType.replace(
      "_",
      " "
    )} ${betTypeText} ${sharedProp.line} | Oddsmash`,
    description: `Compare odds for ${
      sharedProp.player
    }'s ${sharedProp.statType.replace(
      "_",
      " "
    )} ${betTypeText.toLowerCase()} line of ${
      sharedProp.line
    } across multiple sportsbooks.`,
    openGraph: {
      title: `${sharedProp.player} ${sharedProp.statType.replace(
        "_",
        " "
      )} ${betTypeText} ${sharedProp.line} | Oddsmash`,
      description: `Compare odds for ${
        sharedProp.player
      }'s ${sharedProp.statType.replace(
        "_",
        " "
      )} ${betTypeText.toLowerCase()} line of ${
        sharedProp.line
      } across multiple sportsbooks.`,
      type: "website",
      url: `https://oddsmash.io/share/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${sharedProp.player} ${sharedProp.statType.replace(
            "_",
            " "
          )} ${betTypeText} ${sharedProp.line} odds comparison`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${sharedProp.player} ${sharedProp.statType.replace(
        "_",
        " "
      )} ${betTypeText} ${sharedProp.line} | Oddsmash`,
      description: `Compare odds for ${
        sharedProp.player
      }'s ${sharedProp.statType.replace(
        "_",
        " "
      )} ${betTypeText.toLowerCase()} line of ${
        sharedProp.line
      } across multiple sportsbooks.`,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  try {
    // Get the shared prop data
    const sharedProp = await getSharedProp(id);

    // If no data found, show an error page
    if (!sharedProp) {
      return (
        <div className="container max-w-md mx-auto py-6 px-4">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <h3 className="font-semibold text-lg">Prop Not Found</h3>
                <p className="text-muted-foreground">
                  This share link is invalid or has expired.
                </p>
                <div className="mt-4">
                  <Button variant="default" asChild>
                    <a href="/">Go Back Home</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Check if data is stale
    const isStale = isSharedPropStale(sharedProp);

    // Format timestamp
    const formattedDate = new Date(sharedProp.timestamp).toLocaleString();

    // Format stat type
    const formattedStatType = sharedProp.statType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Format game data - for backward compatibility with older share links
    const homeTeam = sharedProp.homeTeam || sharedProp.event?.homeTeam?.name;
    const awayTeam = sharedProp.awayTeam || sharedProp.event?.awayTeam?.name;
    const commenceTime =
      sharedProp.commence_time || sharedProp.event?.commence_time;

    // Default to "both" if no bet type is specified (backward compatibility)
    const betType = sharedProp.betType || "both";

    // Helper to find best odds
    const findBestOddsBooks = (betType: "Over" | "Under") => {
      let bestOdds = Number.NEGATIVE_INFINITY;
      let bestBooks: string[] = [];

      if (Array.isArray(sharedProp.bookmakers)) {
        for (const bookmaker of sharedProp.bookmakers) {
          if (!bookmaker || !bookmaker.key) continue;

          let outcome = null;

          // Check for markets format
          if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
            const market = bookmaker.markets.find(
              (m: Market) => m.key === sharedProp.marketKey
            );
            if (market && Array.isArray(market.outcomes)) {
              outcome = market.outcomes.find(
                (o: Outcome) =>
                  o.name === betType && o.point === sharedProp.line
              );
            }
          }

          // Check for legacy format
          if (!outcome && bookmaker.outcomes) {
            if (betType === "Over" && bookmaker.outcomes.over) {
              outcome = { price: bookmaker.outcomes.over.price };
            } else if (betType === "Under" && bookmaker.outcomes.under) {
              outcome = { price: bookmaker.outcomes.under.price };
            }
          }

          if (outcome) {
            if (outcome.price > bestOdds) {
              bestOdds = outcome.price;
              bestBooks = [bookmaker.key];
            } else if (outcome.price === bestOdds) {
              bestBooks.push(bookmaker.key);
            }
          }
        }
      }

      return {
        odds: bestOdds !== Number.NEGATIVE_INFINITY ? bestOdds : 0,
        books: bestBooks,
      };
    };

    const bestOver = findBestOddsBooks("Over");
    const bestUnder = findBestOddsBooks("Under");

    // Helper to check if a bookmaker has a given outcome
    const hasOutcome = (
      bookmaker: BookmakerData,
      betType: "Over" | "Under"
    ) => {
      if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
        const market = bookmaker.markets.find(
          (m: Market) => m.key === sharedProp.marketKey
        );
        if (market && Array.isArray(market.outcomes)) {
          return market.outcomes.some(
            (o: Outcome) => o.name === betType && o.point === sharedProp.line
          );
        }
      }

      if (bookmaker.outcomes) {
        if (betType === "Over" && bookmaker.outcomes.over) {
          return true;
        } else if (betType === "Under" && bookmaker.outcomes.under) {
          return true;
        }
      }

      return false;
    };

    // Helper to get outcome price
    const getOutcomePrice = (
      bookmaker: BookmakerData,
      betType: "Over" | "Under"
    ) => {
      if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
        const market = bookmaker.markets.find(
          (m: Market) => m.key === sharedProp.marketKey
        );
        if (market && Array.isArray(market.outcomes)) {
          const outcome = market.outcomes.find(
            (o: Outcome) => o.name === betType && o.point === sharedProp.line
          );
          if (outcome) return outcome.price;
        }
      }

      if (bookmaker.outcomes) {
        if (betType === "Over" && bookmaker.outcomes.over) {
          return bookmaker.outcomes.over.price;
        } else if (betType === "Under" && bookmaker.outcomes.under) {
          return bookmaker.outcomes.under.price;
        }
      }

      return null;
    };

    // Helper to get outcome link
    const getOutcomeLink = (
      bookmaker: BookmakerData,
      betType: "Over" | "Under"
    ) => {
      // Check if shared prop data has SIDs or links maps
      const sidKey = `${bookmaker.key}_${betType.toLowerCase()}`;
      const sid = sharedProp.sids?.[sidKey];
      const link = sharedProp.links?.[sidKey];

      // If we have a direct link, return it
      if (link) {
        return link;
      }

      // Check in bookmaker data for links
      if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
        const market = bookmaker.markets.find(
          (m: Market) => m.key === sharedProp.marketKey
        );
        if (market && Array.isArray(market.outcomes)) {
          const outcome = market.outcomes.find(
            (o: Outcome) => o.name === betType && o.point === sharedProp.line
          );
          if (outcome && "link" in outcome) {
            return (outcome as any).link;
          }
        }
      }

      // Check legacy format
      if (bookmaker.outcomes) {
        if (
          betType === "Over" &&
          bookmaker.outcomes.over &&
          "link" in bookmaker.outcomes.over
        ) {
          return (bookmaker.outcomes.over as any).link;
        } else if (
          betType === "Under" &&
          bookmaker.outcomes.under &&
          "link" in bookmaker.outcomes.under
        ) {
          return (bookmaker.outcomes.under as any).link;
        }
      }

      return null;
    };

    // Add a helper function to check if any direct links are available
    const hasBettingLinks = (): boolean => {
      // Check if we have any direct links in the shared prop data
      if (sharedProp.links && Object.keys(sharedProp.links).length > 0) {
        return true;
      }

      // Check in bookmaker data
      if (Array.isArray(sharedProp.bookmakers)) {
        for (const bookmaker of sharedProp.bookmakers) {
          // Check for relevant links based on betType
          if (
            (betType === "both" || betType === "over") &&
            getOutcomeLink(bookmaker, "Over")
          ) {
            return true;
          }

          if (
            (betType === "both" || betType === "under") &&
            getOutcomeLink(bookmaker, "Under")
          ) {
            return true;
          }
        }
      }

      return false;
    };

    // Generate sharing URLs
    const betTypeText =
      betType === "over" ? "Over" : betType === "under" ? "Under" : "";

    const shareUrl = `https://oddsmash.io/share/${id}`;
    const shareText = `Check out ${
      sharedProp.player
    }'s ${formattedStatType} ${betTypeText.toLowerCase()} line of ${
      sharedProp.line
    } odds`;

    // Social sharing URLs
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    const emailShareUrl = `mailto:?subject=${encodeURIComponent(
      `${sharedProp.player}'s ${formattedStatType} ${betTypeText} Line of ${sharedProp.line}`
    )}&body=${encodeURIComponent(`${shareText}: ${shareUrl}`)}`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
      `${shareText}: ${shareUrl}`
    )}`;
    const redditShareUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;

    // Determine if we should show Over, Under, or both
    const showOver = betType === "both" || betType === "over";
    const showUnder = betType === "both" || betType === "under";

    // Count how many bookmakers have each outcome type
    let overBookmakerCount = 0;
    let underBookmakerCount = 0;

    if (Array.isArray(sharedProp.bookmakers)) {
      for (const bookmaker of sharedProp.bookmakers) {
        if (hasOutcome(bookmaker, "Over")) overBookmakerCount++;
        if (hasOutcome(bookmaker, "Under")) underBookmakerCount++;
      }
    }

    // Generate team abbreviations
    const getTeamAbbreviation = (teamName: string) => {
      if (!teamName) return "";

      // Split by spaces and get first letter of each word
      const words = teamName.split(" ");
      if (words.length === 1) {
        // If single word, return first 3 letters
        return teamName.substring(0, 3).toUpperCase();
      } else {
        // If multiple words, return first letter of each word (up to 3)
        return words
          .slice(0, 3)
          .map((word) => word[0])
          .join("")
          .toUpperCase();
      }
    };

    const homeTeamAbbr = getTeamAbbreviation(homeTeam);
    const awayTeamAbbr = getTeamAbbreviation(awayTeam);

    return (
      <div className="container max-w-md md:max-w-2xl mx-auto py-6 px-4">
        <Card className="shadow-md overflow-hidden border-none bg-gradient-to-b from-background to-muted/30">
          <CardHeader className="pb-3 md:pb-4 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

            {/* Logo in top right */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <a
                href="/"
                className="block transition-transform hover:scale-105"
              >
                <Image
                  src="/icon.png"
                  alt="Oddsmash"
                  width={40}
                  height={40}
                  className="h-8 w-8 md:h-10 md:w-10"
                />
              </a>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col gap-4">
                <div>
                  {/* Enhanced player name - larger and bolder */}
                  <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                    {sharedProp.player}
                  </CardTitle>

                  {/* Stat type and line with medium weight */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className="px-2.5 py-1 text-sm font-medium"
                    >
                      {formattedStatType}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="px-2.5 py-1 text-sm font-medium"
                    >
                      Line: {sharedProp.line}
                    </Badge>

                    {betType !== "both" && (
                      <Badge
                        className={cn(
                          "px-2.5 py-1 text-sm font-medium",
                          betType === "over"
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        )}
                        variant="outline"
                      >
                        {betType === "over" ? (
                          <span className="flex items-center">
                            <ChevronUp className="h-3.5 w-3.5 mr-1" />
                            Over
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ChevronDown className="h-3.5 w-3.5 mr-1" />
                            Under
                          </span>
                        )}
                      </Badge>
                    )}
                  </div>

                  {/* Game info with reduced opacity and team abbreviations */}
                  {homeTeam && awayTeam && (
                    <div className="mt-3 text-sm flex flex-wrap items-center gap-2 text-muted-foreground">
                      <div className="flex items-center">
                        {homeTeamAbbr && (
                          <span className="inline-flex items-center justify-center h-6 w-10 bg-muted rounded text-xs font-semibold mr-1.5">
                            {homeTeamAbbr}
                          </span>
                        )}
                        <span className="font-medium">{homeTeam}</span>
                      </div>
                      <span className="text-muted-foreground/70">vs</span>
                      <div className="flex items-center">
                        {awayTeamAbbr && (
                          <span className="inline-flex items-center justify-center h-6 w-10 bg-muted rounded text-xs font-semibold mr-1.5">
                            {awayTeamAbbr}
                          </span>
                        )}
                        <span className="font-medium">{awayTeam}</span>
                      </div>
                      {commenceTime && (
                        <>
                          <span className="text-muted-foreground/70">•</span>
                          <span className="text-muted-foreground/70">
                            {(() => {
                              try {
                                // Compact date format
                                return new Date(commenceTime).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                );
                              } catch (error) {
                                return null;
                              }
                            })()}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons in a row below player info with tooltips */}
                <div className="flex items-center gap-2 pt-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <RefreshButton id={id} isStale={isStale} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Refresh odds data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <ComparePropsButton
                            sportId={sharedProp.sportId}
                            statType={formattedStatType}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Compare with other props</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <ShareModalButton
                            url={shareUrl}
                            title={shareText}
                            twitterUrl={twitterShareUrl}
                            facebookUrl={facebookShareUrl}
                            emailUrl={emailShareUrl}
                            whatsappUrl={whatsappShareUrl}
                            redditUrl={redditShareUrl}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Share this prop</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-3 space-y-6 relative z-10">
            {hasBettingLinks() && (
              <div className="mb-2 p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">
                  Direct betting links available
                </p>
              </div>
            )}

            {/* Display odds in a single column on mobile, two columns on desktop if needed */}
            <div
              className={cn(
                "grid gap-6",
                betType === "both" && "md:grid-cols-2"
              )}
            >
              {/* OVER section */}
              {showOver && overBookmakerCount > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 shadow-sm">
                      <ChevronUp className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base flex items-center">
                      Over {sharedProp.line}
                    </h3>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-card p-1">
                    {Array.isArray(sharedProp.bookmakers) &&
                      sharedProp.bookmakers
                        .filter((bookmaker) => hasOutcome(bookmaker, "Over"))
                        .sort((a, b) => {
                          // Sort by best odds first
                          const priceA = getOutcomePrice(a, "Over") || 0;
                          const priceB = getOutcomePrice(b, "Over") || 0;
                          return priceB - priceA;
                        })
                        .map((bookmaker, index, array) => {
                          const price = getOutcomePrice(bookmaker, "Over");
                          if (price === null) return null;

                          const sportsbook = sportsbooks.find(
                            (sb) => sb.id === bookmaker.key
                          );
                          const isBest = bestOver.books.includes(bookmaker.key);
                          const betLink = getOutcomeLink(bookmaker, "Over");

                          return (
                            <div key={`over-${bookmaker.key}`}>
                              <BookmakerCard
                                bookmaker={bookmaker}
                                sportsbook={sportsbook}
                                betType="Over"
                                betLink={betLink}
                                price={price}
                                isBest={isBest}
                              />
                              {index < array.length - 1 && (
                                <Separator className="my-1 opacity-30" />
                              )}
                            </div>
                          );
                        })}
                  </div>
                </div>
              )}

              {/* UNDER section */}
              {showUnder && underBookmakerCount > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-destructive/15 shadow-sm">
                      <ChevronDown className="h-4 w-4 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-base flex items-center">
                      Under {sharedProp.line}
                    </h3>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-card p-1">
                    {Array.isArray(sharedProp.bookmakers) &&
                      sharedProp.bookmakers
                        .filter((bookmaker) => hasOutcome(bookmaker, "Under"))
                        .sort((a, b) => {
                          // Sort by best odds first
                          const priceA = getOutcomePrice(a, "Under") || 0;
                          const priceB = getOutcomePrice(b, "Under") || 0;
                          return priceB - priceA;
                        })
                        .map((bookmaker, index, array) => {
                          const price = getOutcomePrice(bookmaker, "Under");
                          if (price === null) return null;

                          const sportsbook = sportsbooks.find(
                            (sb) => sb.id === bookmaker.key
                          );
                          const isBest = bestUnder.books.includes(
                            bookmaker.key
                          );
                          const betLink = getOutcomeLink(bookmaker, "Under");

                          return (
                            <div key={`under-${bookmaker.key}`}>
                              <BookmakerCard
                                bookmaker={bookmaker}
                                sportsbook={sportsbook}
                                betType="Under"
                                betLink={betLink}
                                price={price}
                                isBest={isBest}
                              />
                              {index < array.length - 1 && (
                                <Separator className="my-1 opacity-30" />
                              )}
                            </div>
                          );
                        })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center pt-3 pb-4 gap-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {formattedDate}
            </div>
            <div className="text-xs text-center text-muted-foreground group hover:text-primary transition-colors duration-300">
              <span className="inline-flex items-center">
                Powered by{" "}
                <a
                  href="/"
                  className="text-primary hover:underline inline-flex items-center ml-1 group-hover:scale-105 transition-transform duration-300"
                >
                  <Image
                    src="/icon.png"
                    alt="Oddsmash"
                    width={16}
                    height={16}
                    className="h-4 w-4 mr-1"
                  />
                  Oddsmash
                </a>
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading share:", error);
    return (
      <div className="container max-w-md mx-auto py-6 px-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h3 className="font-semibold text-lg">Error Loading Data</h3>
              <p className="text-muted-foreground">
                There was a problem loading this share data. Please try again
                later.
              </p>
              <div className="mt-4">
                <Button variant="default" asChild>
                  <a href="/">Go Back Home</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
