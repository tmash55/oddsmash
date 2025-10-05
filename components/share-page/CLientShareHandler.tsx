"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { decompressFromEncodedURIComponent } from "lz-string";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define types
interface MinifiedShareData {
  p: string;
  l: number;
  s: string;
  m: string;
  b: Array<{
    k: string;
    o: {
      v: number | null;
      u: number | null;
    };
  }>;
}

export function ClientShareHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const compressedData = searchParams.get("d");
    const legacyData = searchParams.get("data");

    if (!compressedData && !legacyData) return;

    const handle = async () => {
      try {
        if (compressedData) {
          const decompressed =
            decompressFromEncodedURIComponent(compressedData);
          if (!decompressed) throw new Error("Failed to decompress data");

          const decodedData: MinifiedShareData = JSON.parse(decompressed);

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
                    b.o.v !== null
                      ? { name: "Over", price: b.o.v, point: decodedData.l }
                      : null,
                    b.o.u !== null
                      ? { name: "Under", price: b.o.u, point: decodedData.l }
                      : null,
                  ].filter(Boolean),
                },
              ],
            })),
            sportId: "default",
          };

          await storeDataOnServer(fullData);
        } else if (legacyData) {
          const decodedLegacyData = JSON.parse(atob(legacyData));
          await storeDataOnServer(decodedLegacyData);
        }
      } catch (err) {
        console.error("Error handling legacy share:", err);
      }
    };

    handle();
  }, [searchParams, router]);

  const storeDataOnServer = async (data: any) => {
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { shareId } = await response.json();
        router.push(`/share/${shareId}`);
      }
    } catch (error) {
      console.error("Error storing share data:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redirecting to New Share Format</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          We&apos;ve updated our sharing system for better performance. Please
          wait while we redirect you...
        </p>
        <div className="w-8 h-8 border-4 border-t-primary border-muted rounded-full animate-spin mx-auto my-4"></div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </CardFooter>
    </Card>
  );
}
