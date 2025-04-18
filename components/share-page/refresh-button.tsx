"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  shareId: string;
  isStale: boolean;
}

export default function RefreshButton({ shareId, isStale }: RefreshButtonProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Call the refresh API
      const response = await fetch('/api/share/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: shareId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Navigate to the new share page ID if provided
        if (data.id && data.id !== shareId) {
          router.push(`/share/${data.id}`);
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
  
  return (
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
  );
} 