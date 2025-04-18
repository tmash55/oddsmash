"use client";

import type React from "react";

import { useState } from "react";
import {
  RefreshCw,
  Copy,
  Twitter,
  Facebook,
  Mail,
  Share2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Reddit icon component - since Lucide doesn't have a built-in Reddit icon
function RedditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M17.5 12a2.5 2.5 0 01-2.5 2.5m-6.5-2.5a2.5 2.5 0 00-2.5 2.5m12-2.5a5 5 0 00-9.5-2.5 5 5 0 00-2.5 0 5 5 0 00-2 1m10.5 5a3.5 3.5 0 01-5 0 3.5 3.5 0 01-5 0" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
    </svg>
  );
}

export function RefreshButton({
  id,
  isStale,
}: {
  id: string;
  isStale: boolean;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log(`Refreshing share ID: ${id}`);

      // Call the refresh API
      const res = await fetch(`/api/share/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shareId: id }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error response from refresh API:", errorData);
        throw new Error(errorData.error || "Failed to refresh data");
      }

      const result = await res.json();
      console.log("Refresh response:", result);

      // Force a complete page reload to get fresh data from the server
      window.location.href = window.location.href;

      toast.success("Odds data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh odds data");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={refreshing}
      className={cn(
        "relative overflow-hidden transition-all",
        isStale &&
          "border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
      )}
    >
      <RefreshCw
        className={cn(
          "h-4 w-4 mr-1",
          refreshing ? "animate-spin" : "",
          isStale && "text-amber-500"
        )}
      />
      <span className="sr-only md:not-sr-only md:inline">Refresh</span>

      {isStale && (
        <span className="absolute inset-0 bg-amber-100/20 dark:bg-amber-800/10 animate-pulse"></span>
      )}
    </Button>
  );
}

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");

    // Reset after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      className={copied ? "bg-primary/10 text-primary border-primary/30" : ""}
    >
      <Copy className="h-4 w-4 mr-1" />
      <span className="sr-only md:not-sr-only md:inline">
        {copied ? "Copied" : "Copy"}
      </span>
    </Button>
  );
}

export function ComparePropsButton({
  sportId,
  statType,
}: {
  sportId?: string;
  statType: string;
}) {
  const router = useRouter();

  const handleNavigate = () => {
    // Default URL for props comparison
    let url = "/props";

    if (sportId) {
      // Special case for basketball_nba - should be just "nba"
      if (sportId === "basketball_nba") {
        url = "/nba/props";
      }
      // Special case for baseball_mlb - should be just "mlb"
      else if (sportId === "baseball_mlb") {
        url = "/mlb/props";
      }
      // Special case for football_nfl - should be just "nfl"
      else if (sportId === "football_nfl") {
        url = "/nfl/props";
      }
      // For other sports, replace underscore with hyphen
      else {
        const formattedSportId = sportId.replace("_", "-");
        url = `/${formattedSportId}/props`;
      }
    }

    // Navigate to the props comparison page without including prop type
    router.push(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleNavigate}
      className="relative overflow-hidden"
    >
      <Zap className="h-4 w-4 mr-1 text-primary" />
      <span className="sr-only md:not-sr-only md:inline">Compare</span>
    </Button>
  );
}

export function ShareModalButton({
  url,
  title,
  twitterUrl,
  facebookUrl,
  emailUrl,
  whatsappUrl,
  redditUrl,
}: {
  url: string;
  title: string;
  twitterUrl: string;
  facebookUrl: string;
  emailUrl: string;
  whatsappUrl: string;
  redditUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");

    // Reset after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
        >
          <Share2 className="h-4 w-4 mr-1" />
          <span className="sr-only md:not-sr-only md:inline">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this prop</DialogTitle>
          <DialogDescription>
            Share this prop bet with others via your preferred platform
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className={cn(
                "h-auto py-3 flex flex-col items-center transition-all",
                copied && "bg-primary/10 text-primary border-primary/30"
              )}
              onClick={copyToClipboard}
            >
              <Copy className="h-5 w-5 mb-1.5" />
              <span className="text-xs">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-auto py-3 flex flex-col items-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:hover:border-blue-800/50"
            >
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5 mb-1.5" />
                <span className="text-xs">Twitter</span>
              </a>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-auto py-3 flex flex-col items-center hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 dark:hover:border-blue-800/70"
            >
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-5 w-5 mb-1.5" />
                <span className="text-xs">Facebook</span>
              </a>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-auto py-3 flex flex-col items-center hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400 dark:hover:border-orange-800/50"
            >
              <a href={redditUrl} target="_blank" rel="noopener noreferrer">
                <RedditIcon className="h-5 w-5 mb-1.5" />
                <span className="text-xs">Reddit</span>
              </a>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-auto py-3 flex flex-col items-center hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/30 dark:hover:text-green-400 dark:hover:border-green-800/50"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-5 w-5 mb-1.5" />
                <span className="text-xs">WhatsApp</span>
              </a>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-auto py-3 flex flex-col items-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800/50"
            >
              <a href={emailUrl}>
                <Mail className="h-5 w-5 mb-1.5" />
                <span className="text-xs">Email</span>
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
