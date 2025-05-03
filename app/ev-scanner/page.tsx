import { Metadata } from "next";
import EVScanner from "@/app/components/EVScanner";

export const metadata: Metadata = {
  title: "EV Scanner - OddSmash",
  description: "Find profitable betting opportunities with our EV scanning tool",
};

export default function EVScannerPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Expected Value Scanner</h1>
      <p className="text-muted-foreground mb-8">
        Compare odds from multiple sportsbooks against Pinnacle&apos;s sharp lines to find valuable betting opportunities.
      </p>
      <EVScanner />
    </div>
  );
} 