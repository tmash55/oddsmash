"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { decompressFromEncodedURIComponent } from "lz-string";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define types for the share data formats
interface MinifiedShareData {
  p: string; // player
  l: number; // line
  s: string; // statType
  m: string; // marketKey
  b: Array<{
    k: string; // key
    o: {
      v: number | null; // over price
      u: number | null; // under price
    }
  }>;
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    // Logic to handle transitioning from client-side approach to server-side
    try {
      // Try to get compressed data (from the old approach)
      const compressedData = searchParams.get("d");
      const legacyData = searchParams.get("data");
      
      if (!compressedData && !legacyData) {
        // No data found - show error card
        return;
      }
      
      // We have data in the old format - convert it and store on the server
      
      if (compressedData) {
        // Decompress the data using lz-string
        const decompressed = decompressFromEncodedURIComponent(compressedData);
        if (!decompressed) {
          throw new Error("Failed to decompress data");
        }
        
        const decodedData: MinifiedShareData = JSON.parse(decompressed);
        
        // Transform the minified property names to full names
        const fullData = {
          player: decodedData.p,
          line: decodedData.l,
          statType: decodedData.s,
          marketKey: decodedData.m,
          bookmakers: decodedData.b.map((b) => ({
            key: b.k,
            markets: [
              {
                key: decodedData.m,
                outcomes: [
                  b.o.v !== null ? { name: "Over", price: b.o.v, point: decodedData.l } : null,
                  b.o.u !== null ? { name: "Under", price: b.o.u, point: decodedData.l } : null
                ].filter(Boolean)
              }
            ]
          })),
          sportId: "default"
        };
        
        // Store the data on the server
        storeDataOnServer(fullData);
      } else if (legacyData) {
        // Legacy format (base64)
        const decodedLegacyData = JSON.parse(atob(legacyData));
        
        // Store the data on the server
        storeDataOnServer(decodedLegacyData);
      }
    } catch (err) {
      console.error("Error handling legacy share:", err);
    }
  }, [searchParams, router]);
  
  // Function to store the data on the server and get a share ID
  const storeDataOnServer = async (data: any) => {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { shareId } = await response.json();
        // Redirect to the new share page with the ID
        router.push(`/share/${shareId}`);
      }
    } catch (error) {
      console.error("Error storing share data:", error);
    }
  };
  
  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Redirecting to New Share Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We've updated our sharing system for better performance. Please wait while we redirect you...</p>
          <div className="w-8 h-8 border-4 border-t-primary border-muted rounded-full animate-spin mx-auto my-4"></div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 