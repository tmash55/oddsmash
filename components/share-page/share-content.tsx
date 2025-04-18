"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, RefreshCw, Twitter, Facebook, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmericanOdds } from "@/lib/odds-api";
import { sportsbooks } from "@/data/sportsbooks";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareablePropPayload } from "@/lib/share-utils";

interface ShareContentProps {
  id: string;
  propData: ShareablePropPayload;
  isStale: boolean;
}

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

interface BookmakerWithMarkets {
  key: string;
  title?: string;
  markets: Market[];
}

interface BookmakerWithOutcomes {
  key: string;
  title?: string;
  outcomes: {
    over?: { price: number };
    under?: { price: number };
  };
}

// A union type to handle both formats
type Bookmaker = BookmakerWithMarkets | BookmakerWithOutcomes;

// Type guard to check if bookmaker has markets
function hasMarkets(bookmaker: Bookmaker): bookmaker is BookmakerWithMarkets {
  return 'markets' in bookmaker && Array.isArray((bookmaker as BookmakerWithMarkets).markets);
}

// Type guard to check if bookmaker has outcomes
function hasOutcomes(bookmaker: Bookmaker): bookmaker is BookmakerWithOutcomes {
  return 'outcomes' in bookmaker;
}

export default function ShareContent({ id, propData, isStale }: ShareContentProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Find the best odds for over/under
  const findBestOdds = (betType: "Over" | "Under") => {
    let bestOdds = -Infinity;
    let bestBook = "";
    
    if (!propData.bookmakers || !Array.isArray(propData.bookmakers) || propData.bookmakers.length === 0) {
      return { odds: 0, book: "" };
    }
    
    propData.bookmakers.forEach((bookmaker: any) => {
      // Skip if bookmaker is not valid
      if (!bookmaker || !bookmaker.key) return;
      
      // Handle different formats of bookmaker data
      let outcome: { price: number } | undefined = undefined;
      
      // Format 1: Check if bookmaker has markets array
      if (hasMarkets(bookmaker)) {
        const market = bookmaker.markets.find(
          (m) => m.key === propData.marketKey
        );
        
        if (market && Array.isArray(market.outcomes)) {
          outcome = market.outcomes.find(
            (o) => o.name === betType && o.point === propData.line
          );
        }
      }
      
      // Format 2: Check if bookmaker has direct outcomes object
      else if (hasOutcomes(bookmaker)) {
        if (betType === "Over" && bookmaker.outcomes.over) {
          outcome = { price: bookmaker.outcomes.over.price };
        } else if (betType === "Under" && bookmaker.outcomes.under) {
          outcome = { price: bookmaker.outcomes.under.price };
        }
      }
      
      if (outcome && outcome.price > bestOdds) {
        bestOdds = outcome.price;
        bestBook = bookmaker.key;
      }
    });
    
    return { odds: bestOdds !== -Infinity ? bestOdds : 0, book: bestBook };
  };
  
  const bestOver = findBestOdds("Over");
  const bestUnder = findBestOdds("Under");
  
  // Refresh the prop data
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Call the refresh API
      const response = await fetch('/api/share/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (response.ok) {
        const { id: newId } = await response.json();
        // Navigate to the new share page ID if provided
        if (newId && newId !== id) {
          router.push(`/share/${newId}`);
        } else {
          // Otherwise just refresh the current page
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Copy share link to clipboard
  const copyLink = () => {
    const shareUrl = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Share on social media
  const shareOnTwitter = () => {
    const text = `Check out ${propData.player}'s ${propData.statType.replace('_', ' ')} line of ${propData.line} odds`;
    const url = `${window.location.origin}/share/${id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };
  
  const shareOnFacebook = () => {
    const url = `${window.location.origin}/share/${id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };
  
  const shareByEmail = () => {
    const subject = `${propData.player}'s ${propData.statType.replace('_', ' ')} Line of ${propData.line}`;
    const body = `Check out ${propData.player}'s ${propData.statType.replace('_', ' ')} line of ${propData.line} odds: ${window.location.origin}/share/${id}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };
  
  // Format timestamp
  const formattedDate = new Date(propData.timestamp).toLocaleString();
  
  // Nicer label for stat type
  const formatStatType = (statType: string) => {
    return statType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Helper to get outcome from a bookmaker
  const getOutcome = (bookmaker: any, betType: "Over" | "Under") => {
    if (hasMarkets(bookmaker)) {
      const market = bookmaker.markets.find(m => m.key === propData.marketKey);
      if (market && Array.isArray(market.outcomes)) {
        return market.outcomes.find(o => o.name === betType && o.point === propData.line);
      }
    } else if (hasOutcomes(bookmaker)) {
      if (betType === "Over" && bookmaker.outcomes.over) {
        return { price: bookmaker.outcomes.over.price };
      } else if (betType === "Under" && bookmaker.outcomes.under) {
        return { price: bookmaker.outcomes.under.price };
      }
    }
    return null;
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{propData.player}</h1>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <span>{formatStatType(propData.statType)}</span>
            <span>•</span>
            <span className="font-medium">Line: {propData.line}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(isStale && "text-amber-500")}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
            {isStale ? "Odds may be outdated" : "Refresh"}
          </Button>
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Odds Comparison</CardTitle>
          <CardDescription>
            Last updated: {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Over Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <ChevronUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Over {propData.line}</h3>
              </div>
              
              {Array.isArray(propData.bookmakers) && propData.bookmakers.map((bookmaker: any) => {
                const outcome = getOutcome(bookmaker, "Over");
                if (!outcome) return null;
                
                const sportsbook = sportsbooks.find(sb => sb.id === bookmaker.key);
                const isBest = bookmaker.key === bestOver.book;
                
                return (
                  <div 
                    key={`over-${bookmaker.key}`}
                    className={cn(
                      "p-3 border rounded-lg flex items-center justify-between",
                      isBest && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {sportsbook && (
                        <div className="w-6 h-6 relative">
                          <img
                            src={sportsbook.logo || "/placeholder.svg"}
                            alt={sportsbook.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="font-medium">{sportsbook?.name || bookmaker.title || bookmaker.key}</span>
                      {isBest && <Badge variant="outline" className="text-primary">Best</Badge>}
                    </div>
                    <span className={cn("text-lg font-bold", isBest && "text-primary")}>
                      {formatAmericanOdds(outcome.price)}
                    </span>
                  </div>
                );
              })}
              
              {(!propData.bookmakers || !Array.isArray(propData.bookmakers) || !propData.bookmakers.some(b => getOutcome(b, "Over"))) && (
                <div className="p-4 border rounded text-muted-foreground text-center">
                  No over odds available
                </div>
              )}
            </div>
            
            {/* Under Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <ChevronDown className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-lg">Under {propData.line}</h3>
              </div>
              
              {Array.isArray(propData.bookmakers) && propData.bookmakers.map((bookmaker: any) => {
                const outcome = getOutcome(bookmaker, "Under");
                if (!outcome) return null;
                
                const sportsbook = sportsbooks.find(sb => sb.id === bookmaker.key);
                const isBest = bookmaker.key === bestUnder.book;
                
                return (
                  <div 
                    key={`under-${bookmaker.key}`}
                    className={cn(
                      "p-3 border rounded-lg flex items-center justify-between",
                      isBest && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {sportsbook && (
                        <div className="w-6 h-6 relative">
                          <img
                            src={sportsbook.logo || "/placeholder.svg"}
                            alt={sportsbook.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="font-medium">{sportsbook?.name || bookmaker.title || bookmaker.key}</span>
                      {isBest && <Badge variant="outline" className="text-primary">Best</Badge>}
                    </div>
                    <span className={cn("text-lg font-bold", isBest && "text-primary")}>
                      {formatAmericanOdds(outcome.price)}
                    </span>
                  </div>
                );
              })}
              
              {(!propData.bookmakers || !Array.isArray(propData.bookmakers) || !propData.bookmakers.some(b => getOutcome(b, "Under"))) && (
                <div className="p-4 border rounded text-muted-foreground text-center">
                  No under odds available
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Separator className="my-2" />
          <div className="w-full flex flex-wrap gap-2 justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="lg" onClick={copyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy share link to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="outline" size="lg" onClick={shareOnTwitter}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            
            <Button variant="outline" size="lg" onClick={shareOnFacebook}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            
            <Button variant="outline" size="lg" onClick={shareByEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground mt-2">
            Powered by <a href="/" className="underline">Oddsmash</a> – The easiest way to compare prop betting odds
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 